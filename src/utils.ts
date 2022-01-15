import {
    APIGatewayProxyEventV2WithRequestContext as ApiEvent,
    APIGatewayEventRequestContextV2 as Context
} from 'aws-lambda';
import { isSchema, Schema } from "joi";
import { ApiError } from "./errors";

/**
 * Wrapper function for Joi validate.
 * Throws an ApiError if the given data doesn't match the schema
 * @returns {any} the input data if it's valid. Throws if data does not fit schema
 */
export function Validate<T>(schema: Schema, data?: unknown): T {
    if (!isSchema(schema)) {
        throw new ApiError(500);
    }

    const inputCheck = schema.validate(data);
    if (inputCheck.error) {
        // Schema validation failed
        console.error('Validation check failed');
        console.error(JSON.stringify(inputCheck.error));
        throw new ApiError(400);
    } else {
        // Schema validation passed
        const validInputs = inputCheck.value;
        return validInputs;
    }
}


/**
 * Get the event body as a JSON object, regardless of how it was formatted
 * in the request (string or base64 string)
 */
export function getBodyJSON<T>(event: ApiEvent<Context>): T {
    if (!event.body) {
        console.error('No body in event');
        throw new ApiError(500);
    }

    if (event.isBase64Encoded) {
        const decoded = JSON.parse(Buffer.from(event.body, 'base64').toString('utf-8'));
        return decoded as T;
    }

    if (typeof event.body === 'string') {
        try {
            return JSON.parse(event.body) as T;
        } catch (e) {
            console.error('Unable to parse event body from string');
            console.error(event.body);
            throw new ApiError(500);
        }
    }

    return event.body;
};
