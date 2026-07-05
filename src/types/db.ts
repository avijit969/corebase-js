export interface CreateTableColumn {
    name: string;
    type: 'integer' | 'text' | 'datetime' | 'boolean' | 'json' | string;
    primary?: boolean;
    autoIncrement?: boolean;
    notNull?: boolean;
    default?: any;
    references?: {
        table: string;
        column: string;
        onDelete?: 'cascade' | 'set null' | 'restrict' | string;
    };
}

export interface CreateTableIndex {
    columns: string[];
    unique?: boolean;
}

export interface CreateTableRls {
    select?: string;
    insert?: string;
    update?: string;
    delete?: string;
}

export interface CreateTableRequest {
    table: string;
    columns: CreateTableColumn[];
    indexes?: CreateTableIndex[];
    /** Accepted today but not yet enforced by the gateway — reserved for future row-level security. */
    rls?: CreateTableRls;
}

export interface TableSummary {
    name: string;
    created_at: string | null;
}

export interface TableDetail {
    table: string;
    columns: CreateTableColumn[];
    indexes: CreateTableIndex[];
    rls: CreateTableRls;
}
