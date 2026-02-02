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

export class RealtimeClient {
    private ws: WebSocket | null = null;
    private subscriptions = new Map<string, Subscription>();
    private reconnectTimer: any = null;
    private config: ClientConfig;
    private auth: AuthClient;
    private isConnected = false;

    constructor(config: ClientConfig, auth: AuthClient) {
        this.config = config;
        this.auth = auth;
    }

    private getUrl() {
        const baseUrl = this.config.baseUrl || 'http://localhost:3000';
        return baseUrl.replace(/^http/, 'ws') + '/v1/realtime';
    }

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

        const url = this.getUrl();
        const headers: any = {
            'x-api-key': this.config.apiKey
        };
        const token = this.auth.getSession()?.access_token;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            // @ts-ignore
            this.ws = new WebSocket(url, [], { headers });
        } catch (e) {
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
            this.scheduleReconnect();
        };

        this.ws.onerror = (e) => {
            console.error('CoreBase Realtime error', e);
        };
    }

    disconnect() {
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
