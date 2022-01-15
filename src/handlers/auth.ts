import {
    APIGatewayProxyEventV2WithRequestContext as ApiEvent,
    APIGatewayEventRequestContextV2 as Context
} from 'aws-lambda';
import { signJWT, verifyToken } from '../auth-utils';
import { ApiError, getErrorResponse } from '../errors';
import { ApiResponse } from '../models/api-response';
import { getResponse } from '../response';
import { PostAuthBody, postAuthSchema } from '../schema/post-auth';
import { getBodyJSON, Validate } from '../utils';
import { compare } from 'bcrypt';
import { ResponseAuthPost } from '../models/responses/res-auth-post';
import * as dotenv from 'dotenv';

dotenv.config({
    path: 'generated.env',
});


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


/**
 * GET /auth is used to check if you are signed in.
 * If the JWT isn't valid, verifyToken with throw 401. Otherwise, return 200
 */
async function handleGet(event: ApiEvent<Context>, context: Context): Promise<ApiResponse> {
    await verifyToken(event);
    return await getResponse(200, event, context);
}


/**
 * POST /auth is used for logging in.
 * The user or device provides a password, and if it is valid, a signed JWT is returned
 */
async function handlePost(event: ApiEvent<Context>, context: Context): Promise<ApiResponse> {
    const body = getBodyJSON(event);
    const postParams = Validate<PostAuthBody>(postAuthSchema, body);
    try {
        if (!process.env.HASHED_PASSWORD) {
            console.error('Password env variable not set');
            throw new ApiError(500);
        }
        const passwordValid = await compare(postParams.password, process.env.HASHED_PASSWORD);
        if (!passwordValid) {
            throw new ApiError(403);
        }
        const token = signJWT();
        const response: ResponseAuthPost = {
            token,
        };
        return await getResponse(201, event, context, response);
    } catch (e) {
        throw new ApiError(403);
    }
}
