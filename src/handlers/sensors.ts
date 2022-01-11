import {
    APIGatewayProxyEventV2WithRequestContext as ApiEvent,
    APIGatewayEventRequestContextV2 as Context
} from 'aws-lambda';
import { verifyToken } from '../auth-utils';
import { ApiError, getErrorResponse } from '../errors';
import { ApiResponse } from '../models/api-response';
import { getResponse } from '../response';
import { postSensorsSchema } from '../schema/post-sensors';
import { Validate } from '../utils';


export async function handler(event: ApiEvent<Context>, context: Context): Promise<ApiResponse> {
    try {
        switch (event.requestContext.http.method) {
            case 'GET': return await handleGet(event, context);
            case 'POST': return await handlePost(event, context);
            default:
                throw new ApiError(405);
        }
    } catch(e) {
        return await getErrorResponse(e, event, context);
    }
}


async function handleGet(event: ApiEvent<Context>, context: Context): Promise<ApiResponse> {
    await verifyToken(event);
    return await getResponse(200, event, context, {
        temperature: 'yes',
    });
}


async function handlePost(event: ApiEvent<Context>, context: Context): Promise<ApiResponse> {
    await verifyToken(event);
    const body = event.body ? JSON.parse(event.body) : '';
    const postParams = Validate(postSensorsSchema, body);
    return await getResponse(201, event, context);
}
