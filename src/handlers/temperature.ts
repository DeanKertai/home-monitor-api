import {
    APIGatewayProxyEventV2WithRequestContext as ApiEvent,
    APIGatewayEventRequestContextV2 as Context
} from 'aws-lambda';
import { verifyToken } from '../auth-utils';
import { ApiError, getErrorResponse } from '../errors';
import { ApiResponse } from '../models/api-response';
import { getResponse } from '../response';
import { postAuthSchema } from '../schema/post-auth';
import { getBodyJSON, Validate } from '../utils';
import { GetTemperatureQuery, getTemperatureQuerySchema } from '../schema/get-temperature';
import { getFromTo, putItem } from '../db';
import { DbTables } from '../models/db-tables';
import { ResponseTemperatureGet } from '../models/responses/res-temperature-get';
import { DbTemperature } from '../models/tables/db-temperature';
import { PostTemperatureBody, postTemperatureSchema } from '../schema/post-temperature';


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
    const queryParams = Validate<GetTemperatureQuery>(getTemperatureQuerySchema, event.queryStringParameters);
    const results = await getFromTo<DbTemperature>(
        DbTables.Temperature,
        'deviceId',
        queryParams.deviceId,
        'timestamp',
        queryParams.from,
        queryParams.to
    );
    if (!results) {
        throw new ApiError(404);
    } else {
        const response: ResponseTemperatureGet = {
            from: queryParams.from,
            to: queryParams.to,
            deviceId: queryParams.deviceId,
            results,
        }
        return await getResponse(200, event, context, results);
    }
}


async function handlePost(event: ApiEvent<Context>, context: Context): Promise<ApiResponse> {
    await verifyToken(event);
    const body = getBodyJSON(event);
    const postParams = Validate<PostTemperatureBody>(postTemperatureSchema, body);
    
    // TODO: Make sure it's a valid device ID
    await putItem<DbTemperature>(DbTables.Temperature, {
        deviceId: postParams.deviceId,
        timestamp: postParams.timestamp,
        celsius: postParams.celsius,
    });

    return await getResponse(201, event, context);
}
