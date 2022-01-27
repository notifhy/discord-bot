import { Hypixel429 } from '../@types/hypixel';
import { Response } from 'node-fetch';
import HTTPError from './HTTPError';

export default class RateLimitError extends HTTPError<Hypixel429> {
    constructor({
        message,
        json,
        response,
    }: {
        message?: string | undefined,
        json: Hypixel429 | null,
        response: Response,
    }) {
        super({
            message: message,
            json: json,
            response: response,
            url: response.url,
        });

        this.name = 'RateLimitError';

        Object.setPrototypeOf(this, RateLimitError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}