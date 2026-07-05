export type FunctionTriggerType = 'http' | 'cron' | 'event';
export type FunctionEventOp = 'insert' | 'update' | 'delete' | 'auth.signup';
export type FunctionStatus = 'draft' | 'deployed' | 'failed';

/** A function row as returned by list/get. `code` is omitted from list results. */
export interface FunctionRow {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    code?: string;
    main_module: string;
    compatibility_date: string;
    script_name: string;
    status: FunctionStatus;
    trigger_type: FunctionTriggerType;
    cron_expression?: string | null;
    event_table?: string | null;
    event_op?: FunctionEventOp | null;
    is_active: number;
    version: number;
    created_at?: string;
    updated_at?: string;
}

export interface CreateFunctionInput {
    name: string;
    description?: string;
    code?: string;
    trigger_type: FunctionTriggerType;
    cron_expression?: string;
    event_table?: string;
    event_op?: FunctionEventOp;
    compatibility_date?: string;
}

export interface UpdateFunctionInput {
    description?: string;
    code?: string;
    cron_expression?: string | null;
    event_table?: string | null;
    event_op?: FunctionEventOp | null;
    is_active?: boolean;
}

export interface FunctionDeployment {
    id: string;
    function_id: string;
    version: number;
    script_name: string;
    status: 'success' | 'failed';
    cf_errors: string | null;
    deployed_by: string | null;
    created_at?: string;
}

export interface FunctionInvocation {
    id: string;
    function_id: string;
    script_name: string;
    trigger_source: 'http' | 'cron' | 'event';
    status: string;
    http_status: number | null;
    duration_ms: number | null;
    error: string | null;
    created_at?: string;
}

/** Options for `client.functions.invoke()`. */
export interface FunctionInvokeInit {
    method?: string;
    /** Appended after `/invoke`, e.g. `/sub/path`. */
    path?: string;
    headers?: Record<string, string>;
    body?: BodyInit;
}
