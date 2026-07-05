import { RequestHandler } from './query';
import { ClientResponse, CustomEmailTemplate } from './types';

/**
 * Custom transactional email templates. If a template exists, it's used automatically
 * in place of the default welcome email when an end user signs up (`client.auth.signUp`).
 */
export class CustomEmailClient {
    constructor(private request: RequestHandler) { }

    async create(template: { name: string; subject: string; body: string }): Promise<ClientResponse<{ message: string; email: CustomEmailTemplate }>> {
        return this.request('/custom-email', { method: 'POST', body: JSON.stringify(template) });
    }

    async list(): Promise<ClientResponse<{ message: string; result: CustomEmailTemplate[] }>> {
        return this.request('/custom-email', { method: 'GET' });
    }

    async get(id: string): Promise<ClientResponse<{ message: string; result: CustomEmailTemplate }>> {
        return this.request(`/custom-email/${encodeURIComponent(id)}`, { method: 'GET' });
    }

    async update(id: string, template: { name?: string; subject?: string; body?: string }): Promise<ClientResponse<{ message: string; email: CustomEmailTemplate }>> {
        return this.request(`/custom-email/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(template) });
    }

    async delete(id: string): Promise<ClientResponse<{ message: string; result: any }>> {
        return this.request(`/custom-email/${encodeURIComponent(id)}`, { method: 'DELETE' });
    }

    /** Manually sends a template to an address (outside the automatic signup flow). */
    async send(id: string, input: { to: string; name: string; projectName: string }): Promise<ClientResponse<{ message: string }>> {
        return this.request(`/custom-email/${encodeURIComponent(id)}/send`, { method: 'POST', body: JSON.stringify(input) });
    }
}
