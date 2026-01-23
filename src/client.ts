import { AuthClient } from './auth';
import { QueryBuilder } from './query';
import { ClientConfig } from './types';

export class CoreBaseClient {
    public auth: AuthClient;
    private config: ClientConfig;

    constructor(config: ClientConfig) {
        if (!config.apiKey) {
            throw new Error('CoreBase: apiKey is required.');
        }
        if (!config.baseUrl) {
            console.warn('CoreBase: baseUrl not provided, defaulting to http://localhost:3000');
        }
        this.config = config;
        this.auth = new AuthClient(config);
    }

    from<T = any>(table: string): QueryBuilder<T> {
        return new QueryBuilder<T>(
            (path, options) => this.auth.request(path, options),
            table
        );
    }
}

export function createClient(baseUrl: string, apiKey: string) {
    return new CoreBaseClient({ baseUrl, apiKey });
}
