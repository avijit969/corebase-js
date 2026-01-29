import { AuthClient } from './auth';
import { ClientResponse } from './types';

export class StorageClient {
    private auth: AuthClient;

    constructor(auth: AuthClient) {
        this.auth = auth;
    }

    /**
     * Uploads a file to the storage bucket.
     * This involves two steps:
     * 1. Getting a signed upload URL from the API.
     * 2. Uploading the file content directly to the cloud storage provider via the signed URL.
     * 
     * @param file The File object to upload.
     * @returns The key of the uploaded file.
     */
    async upload(file: File): Promise<ClientResponse<{ key: string; url: string }>> {
        // 1. Get Signed URL
        const { data: signData, error: signError } = await this.auth.request<{ uploadUrl: string; key: string }>('/storage/upload/sign', {
            method: 'POST',
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
                size: file.size,
            }),
        });

        if (signError) {
            return { data: null, error: signError };
        }

        if (!signData) {
            return { data: null, error: { message: 'Failed to retrieve signed upload URL.' } };
        }

        try {
            // 2. Upload File to Signed URL
            const uploadResponse = await fetch(signData.uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type,
                },
                body: file,
            });

            if (!uploadResponse.ok) {
                return {
                    data: null,
                    error: {
                        message: `File upload failed with status ${uploadResponse.status}: ${uploadResponse.statusText}`
                    }
                };
            }

            // Return success with the key. 
            // The URL returned by sign is the upload URL (often with SAS/Signature params).
            // Users typically store the 'key' to reference the file later.
            return {
                data: {
                    key: signData.key,
                    url: signData.uploadUrl // Returning the upload URL might be useful for immediate access if it's still valid/public-read
                },
                error: null
            };

        } catch (err: any) {
            return { data: null, error: { message: err.message || 'Network error during file upload.' } };
        }
    }
}
