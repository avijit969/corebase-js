import { AuthClient } from './auth';
import { ClientConfig } from './types';

export interface RealtimeMessage {
    type: 'subscribe' | 'unsubscribe' | 'data' | 'error';
    id?: string;
    query?: any;
    data?: any;
    error?: any;
}

export type RealtimeCallback = (data: any) => void;

interface Subscription {
    query: any;
    callback: RealtimeCallback;
}

function decodeJwtPayload(token: string): Record<string, any> | null {
    try {
        const base64Url = token.split('.')[1];
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4 !== 0) base64 += '=';
        const binary = atob(base64);
        const json = decodeURIComponent(
            binary.split('').map(c => {
                const hex = c.charCodeAt(0).toString(16);
                return '%' + (hex.length === 1 ? '0' + hex : hex);
            }).join('')
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export class RealtimeClient {
    private ws: WebSocket | null = null;
    private subscriptions = new Map<string, Subscription>();
    private reconnectTimer: any = null;
    private config: ClientConfig;
    private auth: AuthClient;
    private isConnected = false;
    private manualDisconnect = false;

    constructor(config: ClientConfig, auth: AuthClient) {
        this.config = config;
        this.auth = auth;
    }

    /** The project id is read from the current session's access token (`project_id` claim). */
    private getProjectId(): string | null {
        const token = this.auth.getSession()?.access_token;
        if (!token) return null;
        const payload = decodeJwtPayload(token);
        return (payload?.project_id as string) || null;
    }

    private getUrl(projectId: string) {
        const baseUrl = this.config.baseUrl || 'http://localhost:3000';
        let url = baseUrl.replace(/^http/, 'ws') + `/v1/realtime/${encodeURIComponent(projectId)}`;

        // Append Auth params for standard browser support (which doesn't support headers)
        const params = new URLSearchParams();
        if (this.config.apiKey) {
            params.append('x-api-key', this.config.apiKey);
        }

        const token = this.auth.getSession()?.access_token;
        if (token) {
            params.append('token', token);
        }

        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        return url;
    }

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
        this.manualDisconnect = false;

        const projectId = this.getProjectId();
        if (!projectId) {
            console.error('CoreBase Realtime error: no signed-in session — realtime requires a project end-user session (client.auth.signIn/signUp) before connecting.');
            return;
        }

        const url = this.getUrl(projectId);
        const headers: any = {
            'x-api-key': this.config.apiKey
        };
        const token = this.auth.getSession()?.access_token;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            // Try to pass headers (Node.js / React Native)
            // @ts-ignore
            this.ws = new WebSocket(url, undefined, { headers });
        } catch (e) {
            // Fallback for standard browsers
            this.ws = new WebSocket(url);
        }

        if (!this.ws) return;

        this.ws.onopen = () => {
            this.isConnected = true;
            this.resubscribeAll();
        };

        this.ws.onmessage = (event) => {
            try {
                const msg: RealtimeMessage = JSON.parse(event.data as string);
                this.handleMessage(msg);
            } catch (e) {
                console.error('CoreBase Realtime parse error', e);
            }
        };

        this.ws.onclose = () => {
            this.isConnected = false;
            if (!this.manualDisconnect) {
                this.scheduleReconnect();
            }
        };

        this.ws.onerror = (e) => {
            console.error('CoreBase Realtime error', e);
        };
    }

    disconnect() {
        this.manualDisconnect = true;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.isConnected = false;
    }

    subscribe(query: any, callback: RealtimeCallback): string {
        const id = Math.random().toString(36).substring(7);
        this.subscriptions.set(id, { query, callback });
        if (this.isConnected) {
            this.send({ type: 'subscribe', id, query });
        } else {
            this.connect();
        }
        return id;
    }

    unsubscribe(id: string) {
        if (this.subscriptions.has(id)) {
            this.subscriptions.delete(id);
            if (this.isConnected) {
                this.send({ type: 'unsubscribe', id });
            }
        }
    }

    private send(msg: RealtimeMessage) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        }
    }

    private handleMessage(msg: RealtimeMessage) {
        if (msg.type === 'data' && msg.id && msg.data) {
            const sub = this.subscriptions.get(msg.id);
            if (sub) {
                sub.callback(msg.data);
            }
        } else if (msg.type === 'error') {
            console.error('CoreBase Realtime message error:', msg.error);
        }
    }

    private resubscribeAll() {
        this.subscriptions.forEach((sub, id) => {
            this.send({ type: 'subscribe', id, query: sub.query });
        });
    }

    private scheduleReconnect() {
        if (!this.reconnectTimer) {
            this.reconnectTimer = setTimeout(() => {
                this.reconnectTimer = null;
                this.connect();
            }, 3000);
        }
    }
}
