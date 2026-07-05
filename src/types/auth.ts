/** A project's end-user (i.e. an authenticated user of the app you built with CoreBase). */
export interface User {
    id: string;
    email: string;
    name?: string;
    role?: string;
    created_at?: string;
}

/** Session for a project end-user, returned by `client.auth`. */
export interface AuthSession {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    user: User;
}
