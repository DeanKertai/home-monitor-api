import { isSchema, Schema } from "joi";
import { ApiError } from "./errors";

/**
 * Wrapper function for Joi validate.
 * Throws an ApiError if the given data doesn't match the schema
 * @returns {any} the input data if it's valid. Throws if data does not fit schema
 */
export function Validate<T>(schema: Schema, data?: T): T {
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
