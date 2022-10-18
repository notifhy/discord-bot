import type { Response } from 'undici';
import { HTTPError } from './HTTPError';

export class RateLimitError extends HTTPError {
    public constructor({
        message,
        response,
    }: {
        message?: string | undefined,
        response: Response,
    }) {
        super({
            message: message,
            response: response,
            url: response.url,
        });

        this.name = 'RateLimitError';

        Object.setPrototypeOf(this, RateLimitError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}