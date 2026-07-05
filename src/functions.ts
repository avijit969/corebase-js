import { AuthClient } from './auth';
import { RequestHandler } from './query';
import {
    ClientResponse, CreateFunctionInput, FunctionDeployment, FunctionInvocation,
    FunctionInvokeInit, FunctionRow, UpdateFunctionInput
} from './types';

/**
 * Edge Functions — deploy your own code as a Cloudflare Worker, triggered over HTTP,
 * on a cron schedule, or on a database/auth event. Create/edit/list/invoke work on
 * every plan; `deploy()` requires the Workers for Platforms add-on on the gateway's
 * Cloudflare account and returns a `503 FUNCTION_DEPLOY_UNAVAILABLE` error otherwise
 * (the function stays in `draft` status).
 */
export class FunctionsClient {
    constructor(private request: RequestHandler, private auth: AuthClient) { }

    async create(input: CreateFunctionInput): Promise<ClientResponse<{ message: string; function: FunctionRow }>> {
        return this.request('/functions', { method: 'POST', body: JSON.stringify(input) });
    }

    /** Lists functions. `code` is omitted from list results — use `get()` for the full row. */
    async list(): Promise<ClientResponse<{ functions: FunctionRow[] }>> {
        return this.request('/functions', { method: 'GET' });
    }

    async get(id: string): Promise<ClientResponse<{ function: FunctionRow }>> {
        return this.request(`/functions/${encodeURIComponent(id)}`, { method: 'GET' });
    }

    /** `name` and `trigger_type` are immutable. Editing `code` resets status to `draft`. */
    async update(id: string, input: UpdateFunctionInput): Promise<ClientResponse<{ message: string; function: FunctionRow }>> {
        return this.request(`/functions/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
    }

    async delete(id: string): Promise<ClientResponse<{ message: string; id: string; warning?: string }>> {
        return this.request(`/functions/${encodeURIComponent(id)}`, { method: 'DELETE' });
    }

    /** Deploys the function's current code. Returns a `503` error if deployment isn't enabled on this gateway. */
    async deploy(id: string): Promise<ClientResponse<{ message: string; function: FunctionRow }>> {
        return this.request(`/functions/${encodeURIComponent(id)}/deploy`, { method: 'POST' });
    }

    async listDeployments(id: string): Promise<ClientResponse<{ deployments: FunctionDeployment[] }>> {
        return this.request(`/functions/${encodeURIComponent(id)}/deployments`, { method: 'GET' });
    }

    async listInvocations(id: string): Promise<ClientResponse<{ invocations: FunctionInvocation[] }>> {
        return this.request(`/functions/${encodeURIComponent(id)}/invocations`, { method: 'GET' });
    }

    /**
     * Invokes a deployed HTTP function by name. Unlike every other method on this client,
     * this returns a raw Fetch `Response` — not `{data, error}` — because the gateway
     * forwards your deployed Worker's response byte-for-byte and cannot know its shape.
     * Call `.json()`/`.text()`/`.blob()` on the result yourself, and check `.status`/`.ok`.
     */
    async invoke(name: string, init: FunctionInvokeInit = {}): Promise<Response> {
        const url = `${this.auth.baseUrl}/v1/functions/${encodeURIComponent(name)}/invoke${init.path || ''}`;
        return fetch(url, {
            method: init.method || 'GET',
            headers: { ...this.auth.authHeaders, ...init.headers },
            body: init.body,
        });
    }
}
