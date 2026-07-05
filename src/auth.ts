import { ApiResponse, AuthSession, ClientConfig, ClientResponse, User } from './types';

export class AuthClient {
    private config: ClientConfig;
    private session: AuthSession | null = null;
    private storageKey = 'corebase-auth-session';

    constructor(config: ClientConfig) {
        this.config = config;
        this.loadSession();
    }

    get baseUrl() {
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

    /** Auth headers (`x-api-key` + `Authorization` if signed in), without `Content-Type` — for callers building their own raw `fetch()` (binary bodies/responses). */
    get authHeaders(): Record<string, string> {
        const { 'Content-Type': _omit, ...rest } = this.headers;
        return rest;
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

            if (!response.ok) {
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

    /**
     * Rotates the current session's access token using its refresh token.
     * The new session is persisted automatically.
     */
    async refreshSession(): Promise<ClientResponse<{ access_token: string; expires_in: number; user: User }>> {
        const refreshToken = this.session?.refresh_token;
        if (!refreshToken) {
            return { data: null, error: { message: 'No active session to refresh.' } };
        }

        const result = await this.request<{ access_token: string; expires_in: number; user: User }>(
            '/auth/project/refresh',
            { method: 'POST', headers: { Authorization: `Bearer ${refreshToken}` } }
        );

        if (result.data && this.session) {
            this.setSession({ ...this.session, access_token: result.data.access_token, expires_in: result.data.expires_in });
        }

        return result;
    }

    /**
     * Builds the URL to redirect the browser to for an OAuth sign-in (Google/GitHub).
     * The gateway completes the flow and redirects back to the project's configured
     * `success_url` with `access_token`/`refresh_token`/`user_id` in the query string —
     * read those on your success page and pass them to `setSessionFromTokens`.
     *
     * Note: this endpoint identifies the project via the `projectId` query parameter
     * (not the client's API key), since a top-level browser navigation can't carry
     * custom headers.
     */
    getOAuthUrl(provider: 'google' | 'github', projectId: string): string {
        return `${this.baseUrl}/v1/auth/project/auth/${provider}?projectId=${encodeURIComponent(projectId)}`;
    }

    /** Persists a session built from tokens read off the OAuth success-page query string. */
    setSessionFromTokens(tokens: { access_token: string; refresh_token?: string; expires_in?: number; user: User }): void {
        this.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in ?? 0,
            user: tokens.user,
        });
    }

    /** Sets the OAuth client id/secret for this project (Google/GitHub). Admin operation. */
    async updateAuthConfig(projectId: string, config: {
        google_client_id?: string; google_client_secret?: string;
        github_client_id?: string; github_client_secret?: string;
    }): Promise<ClientResponse<{ message: string }>> {
        return this.request(`/auth/project/auth/config?projectId=${encodeURIComponent(projectId)}`, {
            method: 'POST',
            body: JSON.stringify(config),
        });
    }

    /** Gets the configured OAuth client ids/secrets for this project. Admin operation. */
    async getAuthConfig(projectId: string): Promise<ClientResponse<{
        google_client_id?: string; google_client_secret?: string;
        github_client_id?: string; github_client_secret?: string;
    }>> {
        return this.request(`/auth/project/auth/config?projectId=${encodeURIComponent(projectId)}`, {
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
