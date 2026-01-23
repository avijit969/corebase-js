import { ClientResponse } from './types';

export type RequestHandler = <T>(path: string, options?: RequestInit) => Promise<ClientResponse<T>>;

export class PostgrestQueryBuilder<T = any> {
    constructor(
        private request: RequestHandler,
        private tableName: string
    ) { }

    select(columns = '*'): PostgrestFilterBuilder<T> {
        return new PostgrestSelectBuilder<T>(this.request, this.tableName, columns);
    }

    async insert(values: Partial<T> | Partial<T>[]): Promise<ClientResponse<any>> {
        return this.request(`/table_operation/insert/${this.tableName}`, {
            method: 'POST',
            body: JSON.stringify(values),
        });
    }

    update(values: Partial<T>): PostgrestFilterBuilder<any> {
        return new PostgrestFilterBuilder(this.request, this.tableName, 'UPDATE', values);
    }

    delete(): PostgrestFilterBuilder<any> {
        return new PostgrestFilterBuilder(this.request, this.tableName, 'DELETE');
    }
}

export class PostgrestFilterBuilder<T> implements PromiseLike<ClientResponse<T>> {
    protected filters: Record<string, any> = {};

    constructor(
        protected request: RequestHandler,
        protected tableName: string,
        protected method: 'UPDATE' | 'DELETE' | 'SELECT',
        protected body?: any,
        protected columns?: string
    ) { }

    eq(column: string, value: any): this {
        this.filters[column] = value;
        return this;
    }

    then<TResult1 = ClientResponse<T>, TResult2 = never>(
        onfulfilled?: ((value: ClientResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): PromiseLike<TResult1 | TResult2> {
        return this.execute().then(onfulfilled, onrejected);
    }

    async execute(): Promise<ClientResponse<T>> {
        if (this.method === 'SELECT') {
            throw new Error("Execute should be called on SelectBuilder");
        }

        const path = `/table_operation/${this.method.toLowerCase()}/${this.tableName}`;
        let payload: any = {};

        if (this.method === 'UPDATE') {
            payload = {
                updates: this.body, // 'updates' key as per API docs
                where: this.filters
            };
            return this.request(path, { method: 'PUT', body: JSON.stringify(payload) });
        } else if (this.method === 'DELETE') {
            payload = {
                where: this.filters
            };
            return this.request(path, { method: 'DELETE', body: JSON.stringify(payload) });
        }

        return { data: null, error: { message: 'Invalid method' } };
    }
}

export class PostgrestSelectBuilder<T> extends PostgrestFilterBuilder<T> {
    private _limit?: number;
    private _page?: number;
    private _sort?: string;
    private _order?: 'ASC' | 'DESC';

    constructor(request: RequestHandler, tableName: string, columns: string) {
        super(request, tableName, 'SELECT', undefined, columns);
    }

    limit(count: number): this {
        this._limit = count;
        return this;
    }

    page(page: number): this {
        this._page = page;
        return this;
    }

    order(column: string, { ascending = true }: { ascending?: boolean } = {}): this {
        this._sort = column;
        this._order = ascending ? 'ASC' : 'DESC';
        return this;
    }

    single(): this {
        this._limit = 1;
        return this;
    }

    async execute(): Promise<ClientResponse<T>> {
        const payload = {
            columns: this.columns === '*' ? undefined : this.columns?.split(',').map(s => s.trim()),
            where: Object.keys(this.filters).length > 0 ? this.filters : undefined,
            limit: this._limit,
            page: this._page,
            sort: this._sort,
            order: this._order
        };

        const response = await this.request<any>(`/table_operation/select/${this.tableName}`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (response.error) return { data: null, error: response.error };

        const resultData = response.data?.data;
        const meta = response.data?.meta;

        return {
            data: resultData as any,
            error: null,
            count: meta?.total
        };
    }
}
