import {
    APIGatewayProxyEventV2WithRequestContext as ApiEvent,
    APIGatewayEventRequestContextV2 as Context
} from 'aws-lambda';
import { ErrorResponse } from './models/api-error-response';
import { ApiResponse } from './models/api-response';
import { getResponse } from './response';

export class ApiError {
    public name: string;
    public message: string;
    public httpCode: number;
    constructor(httpCode: number, userFacingError?: string) {
        this.name = 'ApiError';
        this.message = userFacingError || '';
        this.httpCode = httpCode;
    }
}

export async function getErrorResponse(
    error: any,
    event: ApiEvent<Context>,
    context: Context
): Promise<ApiResponse> {
    console.error('Returning error response');

    let code: number;
    let userMessage: string;

    if (error instanceof ApiError) {
        code = error.httpCode;
        userMessage = error.message;
        
    } else {
        // If this isn't an ApiError, it's most likely an uncaught exception!
        console.error('Uncaught exception');
        console.error(error);
        code = 500;
        userMessage = 'Internal server error';
    }

    const response: ErrorResponse = {
        status: code,
        error: userMessage,
    };

    return await getResponse(code, event, context, response);
}
