export interface Bucket {
    id: string;
    name: string;
    public: boolean;
    allowed_mime_types: string[];
    file_size_limit: number;
    created_at?: string;
}

export interface StorageFile {
    id: string;
    bucket_id: string;
    filename: string;
    mime_type: string;
    size: number;
    key: string;
    url: string;
    uploaded_by: string | null;
    created_at?: string;
}
