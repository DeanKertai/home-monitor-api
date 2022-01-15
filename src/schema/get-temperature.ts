import Joi from 'joi';
import { deviceIdSchema, timestampSchema } from './common';

export const getTemperatureQuerySchema = Joi.object().keys({
    deviceId: deviceIdSchema.required(),
    from: timestampSchema.required(),
    to: timestampSchema.required(),
});

export interface GetTemperatureQuery {
    deviceId: string;
    from: number;
    to: number;
}
