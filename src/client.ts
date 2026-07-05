import { AuthClient } from './auth';
import { QueryBuilder } from './query';
import { StorageClient } from './storage';
import { RealtimeClient } from './realtime';
import { DbClient } from './db';
import { CronClient } from './cron';
import { CustomEmailClient } from './customEmail';
import { FunctionsClient } from './functions';
import { ClientConfig } from './types';

export class CoreBaseClient {
    /** Auth for your app's end users. */
    public auth: AuthClient;
    public storage: StorageClient;
    public realtime: RealtimeClient;
    /** Schema management (create/alter/drop tables). For row data, use `from()`. */
    public db: DbClient;
    public cron: CronClient;
    public customEmail: CustomEmailClient;
    public functions: FunctionsClient;
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
        this.storage = new StorageClient(this.auth);
        this.realtime = new RealtimeClient(config, this.auth);

        // x-api-key scoped modules — same request path as `from()`/`auth`.
        this.db = new DbClient((path, options) => this.auth.request(path, options));
        this.cron = new CronClient((path, options) => this.auth.request(path, options));
        this.customEmail = new CustomEmailClient((path, options) => this.auth.request(path, options));
        this.functions = new FunctionsClient((path, options) => this.auth.request(path, options), this.auth);
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
