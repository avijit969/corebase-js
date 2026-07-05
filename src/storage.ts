import { AuthClient } from './auth';
import { Bucket, ClientResponse, StorageFile } from './types';

export class StorageClient {
    private auth: AuthClient;

    constructor(auth: AuthClient) {
        this.auth = auth;
    }

    // --- Buckets ---

    async createBucket(bucket: { name: string; public?: boolean; allowedMimeTypes?: string[]; fileSizeLimit?: number }): Promise<ClientResponse<{ message: string; bucket: { name: string; public: boolean } }>> {
        return this.auth.request('/storage/buckets', {
            method: 'POST',
            body: JSON.stringify(bucket),
        });
    }

    async listBuckets(): Promise<ClientResponse<{ buckets: Bucket[] }>> {
        return this.auth.request('/storage/buckets', { method: 'GET' });
    }

    async getBucket(name: string): Promise<ClientResponse<{ bucket: Bucket; files: StorageFile[] }>> {
        return this.auth.request(`/storage/buckets/${encodeURIComponent(name)}`, { method: 'GET' });
    }

    async deleteBucket(name: string): Promise<ClientResponse<{ message: string }>> {
        return this.auth.request(`/storage/buckets/${encodeURIComponent(name)}`, { method: 'DELETE' });
    }

    /** Deletes every file record in the bucket (does not remove the bucket itself). */
    async emptyBucket(name: string): Promise<ClientResponse<{ message: string }>> {
        return this.auth.request(`/storage/buckets/${encodeURIComponent(name)}/empty`, { method: 'POST' });
    }

    // --- Files ---

    /**
     * Uploads a file to a bucket. Two steps under the hood:
     * 1. Registers the file and gets back a same-origin upload URL.
     * 2. PUTs the file content to that URL (authenticated, like every other request).
     *
     * @param file The File object to upload.
     * @param bucketName The name of the bucket to upload the file to.
     */
    async upload(file: File, bucketName: string): Promise<ClientResponse<{ key: string; url: string }>> {
        const { data: signData, error: signError } = await this.auth.request<{ uploadUrl: string; key: string; publicUrl: string; fileId: string }>('/storage/upload/sign', {
            method: 'POST',
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
                size: file.size,
                bucketName,
            }),
        });

        if (signError) {
            return { data: null, error: signError };
        }

        if (!signData) {
            return { data: null, error: { message: 'Failed to retrieve signed upload URL.' } };
        }

        const { error: uploadError } = await this.auth.request<{ message: string; fileId: string }>(
            `/storage/upload/direct/${encodeURIComponent(signData.fileId)}`,
            {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            }
        );

        if (uploadError) {
            return { data: null, error: uploadError };
        }

        return {
            data: {
                key: signData.key,
                url: signData.publicUrl,
            },
            error: null,
        };
    }

    async listFiles(options: { bucket?: string } = {}): Promise<ClientResponse<{ files: StorageFile[] }>> {
        const query = options.bucket ? `?bucket=${encodeURIComponent(options.bucket)}` : '';
        return this.auth.request(`/storage/files${query}`, { method: 'GET' });
    }

    async deleteFile(id: string): Promise<ClientResponse<{ message: string }>> {
        return this.auth.request(`/storage/files/${encodeURIComponent(id)}`, { method: 'DELETE' });
    }

    /** Downloads a file's raw bytes. Returns a `Blob`, unlike every other method (which returns JSON). */
    async downloadFile(id: string): Promise<ClientResponse<Blob>> {
        try {
            const response = await fetch(`${this.auth.baseUrl}/v1/storage/files/${encodeURIComponent(id)}/content`, {
                method: 'GET',
                headers: this.auth.authHeaders,
            });

            if (!response.ok) {
                return { data: null, error: { message: `Download failed with status ${response.status}: ${response.statusText}` } };
            }

            return { data: await response.blob(), error: null };
        } catch (err: any) {
            return { data: null, error: { message: err.message || 'Network error during file download.' } };
        }
    }
}
