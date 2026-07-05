import { RequestHandler } from './query';
import { ClientResponse, CronJob, JobExecution } from './types';

/**
 * Scheduled webhook jobs — fires an outbound HTTP request on a schedule. Distinct from
 * a Function whose `trigger_type` is `'cron'` (see `client.functions`), which runs your
 * own deployed code instead of calling out to a URL.
 */
export class CronClient {
    constructor(private request: RequestHandler) { }

    async create(job: Record<string, any>): Promise<ClientResponse<{ message: string; job: CronJob }>> {
        return this.request('/cron', { method: 'POST', body: JSON.stringify(job) });
    }

    async list(): Promise<ClientResponse<{ jobs: CronJob[] }>> {
        return this.request('/cron', { method: 'GET' });
    }

    async get(id: string): Promise<ClientResponse<{ job: CronJob }>> {
        return this.request(`/cron/${encodeURIComponent(id)}`, { method: 'GET' });
    }

    async update(id: string, job: Record<string, any>): Promise<ClientResponse<{ message: string; job: CronJob }>> {
        return this.request(`/cron/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(job) });
    }

    async delete(id: string): Promise<ClientResponse<{ message: string; id: string }>> {
        return this.request(`/cron/${encodeURIComponent(id)}`, { method: 'DELETE' });
    }

    async listExecutions(id: string): Promise<ClientResponse<{ executions: JobExecution[] }>> {
        return this.request(`/cron/${encodeURIComponent(id)}/executions`, { method: 'GET' });
    }

    async getExecution(id: string, executionId: string): Promise<ClientResponse<{ execution: JobExecution }>> {
        return this.request(`/cron/${encodeURIComponent(id)}/executions/${encodeURIComponent(executionId)}`, { method: 'GET' });
    }
}
