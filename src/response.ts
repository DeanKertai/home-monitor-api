import {
    APIGatewayProxyEventV2WithRequestContext as ApiEvent,
    APIGatewayEventRequestContextV2 as Context
} from 'aws-lambda';
import { ApiResponse } from './models/responses/api-response';

const allowedOrigins = [
  process.env.DOMAIN,
  process.env.DEV_DOMAIN,
];


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

        const origin = event.headers.origin;
        console.log('Origin', origin);
        if (!origin) {
          console.error('CORS error. Missing origin header in request');
          return { statusCode: 400 };
        }
        let matchedOrigin = allowedOrigins.find(o => o === origin);
        if (!matchedOrigin) {
          return { statusCode: 401 };
        }

        response = {
            statusCode: code,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Credentials' : true, // Required for cookies, authorization headers with HTTPS
              'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Kiosk-Player-ID',
              'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT,DELETE',
              'Access-Control-Allow-Origin': matchedOrigin,
              'Access-Control-Max-Age': 7200,  // How long the preflight requests can be cached
              'X-Frame-Options': 'SAMEORIGIN',
              'X-XSS-Protection': '1',
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
