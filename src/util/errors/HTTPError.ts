import type { Response } from 'node-fetch';

export default class HTTPError<JSON> extends Error {
    json: JSON | null;
    response: Response | null;
    status: number;
    statusText: string | null;
    url: string;

    constructor({
        json,
        message,
        response,
        url,
    }: {
        json?: JSON | null;
        message?: string;
        response?: Response;
        url: string;
    }) {
        super(message ?? response?.statusText ?? 'Unknown');
        this.json =
            json ??
            (response?.json().catch(() => null) as JSON | undefined) ??
            null;
        this.name = 'HTTPError';
        this.response = response ?? null;
        this.status = response?.status ?? 500;
        this.statusText = response?.statusText ?? null;
        this.url = url;

        Object.setPrototypeOf(this, HTTPError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
