import { ApiResponse, AuthSession, ClientConfig, ClientResponse, User } from './types';

export class AuthClient {
    private config: ClientConfig;
    private session: AuthSession | null = null;
    private storageKey = 'corebase-auth-session';

    constructor(config: ClientConfig) {
        this.config = config;
        this.loadSession();
    }

    private get baseUrl() {
        return this.config.baseUrl || 'http://localhost:3000';
    }

    private get headers() {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-api-key': this.config.apiKey,
        };
        if (this.session?.access_token) {
            headers['Authorization'] = `Bearer ${this.session.access_token}`;
        }
        return headers;
    }

    public async request<T>(path: string, options: RequestInit = {}): Promise<ClientResponse<T>> {
        try {
            const url = `${this.baseUrl}/v1${path}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.headers,
                    ...options.headers,
                },
            });

            const result: ApiResponse<T> = await response.json();

            if (!response.ok || result.status === 'error') {
                return {
                    data: null,
                    error: result.error || { message: `Request failed with status ${response.status}` },
                };
            }

            return { data: result.data as T, error: null };
        } catch (err: any) {
            return { data: null, error: { message: err.message || 'Network request failed' } };
        }
    }

    // --- Auth Methods ---

    async signUp(credentials: { email: string; password: string; name?: string }): Promise<ClientResponse<{ user: User }>> {
        const { data, error } = await this.request<{ id: string; name: string; email: string; role: string; message: string }>('/auth/project/signup', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        if (error) return { data: null, error };
        if (!data) return { data: null, error: { message: 'No data returned' } };

        return {
            data: {
                user: {
                    id: data.id,
                    email: data.email,
                    name: data.name,
                    role: data.role,
                },
            },
            error: null,
        };
    }

    async signIn(credentials: { email: string; password: string }): Promise<ClientResponse<AuthSession>> {
        const { data, error } = await this.request<AuthSession>('/auth/project/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        if (data) {
            this.setSession(data);
        }

        return { data, error };
    }

    async getUser(): Promise<ClientResponse<{ user: User }>> {
        return this.request<{ user: User }>('/auth/project/me', {
            method: 'GET',
        });
    }

    async signOut(): Promise<{ error: null }> {
        this.session = null;
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(this.storageKey);
        }
        return { error: null };
    }

    getSession() {
        return this.session;
    }

    private setSession(session: AuthSession) {
        this.session = session;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.storageKey, JSON.stringify(session));
        }
    }

    private loadSession() {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                try {
                    this.session = JSON.parse(stored);
                } catch (e) {
                    console.error('Failed to parse session', e);
                }
            }
        }
    }
}
