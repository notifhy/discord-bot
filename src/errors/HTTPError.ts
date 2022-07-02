import type { Response } from 'node-fetch';

export class HTTPError<JSON> extends Error {
    public readonly json: JSON | null;

    public readonly response: Response | null;

    public readonly status: number;

    public readonly statusText: string | null;

    public readonly url: string;

    public constructor({
        json,
        message,
        response,
        url,
    }: {
        json?: JSON | null,
        message?: string,
        response?: Response,
        url: string;
    }) {
        super(message ?? response?.statusText ?? 'Unknown');
        this.json = json
            ?? (response?.json().catch(() => null) as JSON | undefined | null)
            ?? null;
        this.name = 'HTTPError';
        this.response = response ?? null;
        this.status = response?.status ?? 500;
        this.statusText = response?.statusText ?? null;
        this.url = url;

        Object.setPrototypeOf(this, HTTPError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}