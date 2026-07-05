import { RequestHandler } from './query';
import { ClientResponse, CreateTableColumn, CreateTableIndex, CreateTableRequest, CreateTableRls, TableDetail, TableSummary } from './types';

/**
 * Schema management (DDL) — create/alter/drop tables and columns. For inserting,
 * querying, updating, or deleting rows, use `client.from(table)` instead.
 */
export class DbClient {
    constructor(private request: RequestHandler) { }

    async createTable(input: CreateTableRequest): Promise<ClientResponse<{ message: string; table: string; columns: CreateTableColumn[]; indexes?: CreateTableIndex[]; rls?: CreateTableRls }>> {
        return this.request('/db/tables', { method: 'POST', body: JSON.stringify(input) });
    }

    async listTables(): Promise<ClientResponse<{ tables: TableSummary[] }>> {
        return this.request('/db/tables', { method: 'GET' });
    }

    async getTable(table: string): Promise<ClientResponse<TableDetail>> {
        return this.request(`/db/tables/${encodeURIComponent(table)}`, { method: 'GET' });
    }

    async addColumn(table: string, column: CreateTableColumn): Promise<ClientResponse<{ message: string; table: string; column: CreateTableColumn }>> {
        return this.request(`/db/tables/${encodeURIComponent(table)}/columns`, { method: 'POST', body: JSON.stringify(column) });
    }

    async deleteColumn(table: string, column: string): Promise<ClientResponse<{ message: string; table: string; column: string }>> {
        return this.request(`/db/tables/${encodeURIComponent(table)}/columns/${encodeURIComponent(column)}`, { method: 'DELETE' });
    }

    /** Renames a column. */
    async renameColumn(table: string, column: string, input: { name: string }): Promise<ClientResponse<{ message: string; table: string; column: { name: string } }>> {
        return this.request(`/db/tables/${encodeURIComponent(table)}/columns/${encodeURIComponent(column)}`, { method: 'PUT', body: JSON.stringify(input) });
    }

    /** Adds a foreign key to an existing column. Rebuilds the table under the hood — batch changes when possible. */
    async addForeignKey(table: string, input: { column: string; references: { table: string; column: string; onDelete?: string } }): Promise<ClientResponse<{ message: string; table: string; foreignKey: any }>> {
        return this.request(`/db/tables/${encodeURIComponent(table)}/foreign-keys`, { method: 'POST', body: JSON.stringify(input) });
    }

    async deleteTable(table: string): Promise<ClientResponse<{ message: string; table: string }>> {
        return this.request(`/db/tables/${encodeURIComponent(table)}`, { method: 'DELETE' });
    }
}
