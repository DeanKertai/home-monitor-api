import Joi from "joi";
import { deviceIdSchema, timestampSchema } from "./common";

export const postTemperatureSchema = Joi.object().keys({
    deviceId: deviceIdSchema.required(),
    timestamp: timestampSchema.required(),
    celsius: Joi.number().min(-100).max(100).required(),
});

export interface PostTemperatureBody {
    deviceId: string;
    timestamp: number;
    celsius: number;
}
