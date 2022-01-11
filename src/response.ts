import {
    APIGatewayProxyEventV2WithRequestContext as ApiEvent,
    APIGatewayEventRequestContextV2 as Context
} from 'aws-lambda';
import { ApiResponse } from './models/api-response';


const allowedProdOrigin = process.env.DOMAIN;
const allowedDevOrigin = process.env.DEV_DOMAIN;


export async function getResponse(
    code: number,
    event: ApiEvent<Context>,
    context: Context,
    body?: {[key: string]: any},
): Promise<ApiResponse> {

    console.log(`Returning response with code ${code}`);
    if (code >= 400) {
        // Additionally log as an error to make it easier to pick up in logs
        console.error(`Code ${code}`);
    }

    // Default response that will be returned if something goes wrong
    let response: ApiResponse = {
        statusCode: 404,
        body: '',
    };

    try {
        if (!event) {
            throw new Error('Event parameter was not supplied to Success response');
        }

        if (!event.headers?.origin) {
            throw new Error('Missing request origin header');
        }

        if (!isOriginAllowed(event.headers.origin)) {
            throw new Error(`Request origin (${event.headers.origin}) is not in whitelist`);
        }

        response = {
            statusCode: code,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Credentials' : true, // Required for cookies, authorization headers with HTTPS
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
                'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT,DELETE',
                'X-Frame-Options': 'SAMEORIGIN',
                'X-XSS-Protection': '1',
                'Access-Control-Allow-Origin': event.headers.origin,
            },
            body: body ? JSON.stringify(body) : undefined,
        };
        
    } catch (e) {
        code = 0;  // Set to 0 for our internal logs
        console.error('There was an error while trying to build the response');
        console.error(e);
    }

    return response;
}


/**
 * Returns true if the origin is in the whitelist for the current stage
 */
function isOriginAllowed(requestOrigin: string): boolean {
    const allowedOrigin = process.env.NODE_ENV === 'production' ? allowedProdOrigin : allowedDevOrigin;
    return requestOrigin === allowedOrigin;
}
