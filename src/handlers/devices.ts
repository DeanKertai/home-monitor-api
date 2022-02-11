import {
    APIGatewayProxyEventV2WithRequestContext as ApiEvent,
    APIGatewayEventRequestContextV2 as Context
} from 'aws-lambda';
import { verifyToken } from '../auth-utils';
import { ApiError, getErrorResponse } from '../errors';
import { scanTable } from '../db';
import { ApiResponse } from '../models/responses/api-response';
import { getResponse } from '../response';
import { DbTables } from '../models/tables/db-tables';
import { DbDevice } from '../models/tables/db-device';


export async function handler(event: ApiEvent<Context>, context: Context): Promise<ApiResponse> {
    try {
        switch (event.requestContext.http.method) {
            case 'GET': return await handleGet(event, context);
            default:
                throw new ApiError(405);
        }
    } catch(e) {
        return await getErrorResponse(e, event, context);
    }
}


async function handleGet(event: ApiEvent<Context>, context: Context): Promise<ApiResponse> {
    await verifyToken(event);
    const devices = await scanTable<DbDevice>(DbTables.Devices);
    return await getResponse(200, event, context, devices);
}
