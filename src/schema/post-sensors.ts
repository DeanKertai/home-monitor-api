import * as Joi from 'joi';

export const postSensorsSchema = Joi.object().keys({
    deviceId: Joi.string().guid().required(),
    temperature: Joi.number().optional(),
});
