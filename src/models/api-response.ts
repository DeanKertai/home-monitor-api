export interface ApiResponse {
    statusCode: number;
    headers?: {[key: string]: string | boolean};
    body?: string;
    isBase64Encoded?: boolean;
}
