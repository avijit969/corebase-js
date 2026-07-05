export interface CustomEmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    [key: string]: any;
}
