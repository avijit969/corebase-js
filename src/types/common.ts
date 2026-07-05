export interface ApiResponse<T> {
    status: 'success' | 'error';
    data?: T;
    error?: {
        message: string;
        code?: string;
        details?: string;
    };
}

export interface ClientConfig {
    apiKey: string;
    baseUrl?: string;
}

export interface ClientResponse<T> {
    data: T | null;
    error: { message: string; code?: string; details?: string } | null;
    count?: number | null;
}
