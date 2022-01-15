import Joi from "joi";

export const deviceIdSchema = Joi.string().min(1).max(64);
export const timestampSchema = Joi.number().integer().min(0).max(Number.MAX_SAFE_INTEGER);
