import { Response } from 'node-fetch';
import { HTTPError } from './HTTPError';
import { HypixelAPI429 } from '../@types/hypixel';

export class RateLimitError extends HTTPError<HypixelAPI429> {
    public constructor({
        message,
        json,
        response,
    }: {
        message?: string | undefined,
        json: HypixelAPI429 | null,
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