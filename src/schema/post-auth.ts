import * as Joi from 'joi';

export interface PostAuthBody {
    password: string;
}

export const postAuthSchema = Joi.object().keys({
    password: Joi.string().min(6).max(128).required(),
});
