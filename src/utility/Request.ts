import { AbortError } from '../NotifHy/errors/AbortError';
import fetch, {
    RequestInit,
    Response,
} from 'node-fetch';
import { GlobalConstants } from './Constants';
import { Log } from './Log';
import { setTimeout } from 'node:timers';

export class Request {
    readonly restRequestTimeout: number;
    private try: number;
    readonly tryLimit: number;

    constructor(config?: {
        retryLimit?: number,
        restRequestTimeout?: number,
    }) {
        this.restRequestTimeout = config?.restRequestTimeout ??
            GlobalConstants.defaults.request.restRequestTimeout;

        this.try = 0;

        this.tryLimit = (config?.retryLimit ?? 2) + 1;
    }

    async request(url: string, fetchOptions?: RequestInit): Promise<Response> {
        this.try += 1;

        const controller = new AbortController();
        const abortTimeout = setTimeout(
            () => controller.abort(),
            this.restRequestTimeout,
        ).unref();

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                ...fetchOptions,
            });


            if (response.ok === true) {
                if (this.try > 1) {
                    Log.request('Successfully fetched after a retry');
                }

                return response;
            }

            if (
                this.try < this.tryLimit &&
                response.status >= 500 &&
                response.status < 600
            ) {
                Log.request(`Retrying due to a response between 500 and 600: ${response.status}`);
                return this.request(url, fetchOptions);
            }

            return response;
        } catch (error) {
            if (this.try < this.tryLimit) {
                Log.request('Retrying due to an AbortError');
                return this.request(url, fetchOptions);
            }

            throw new AbortError({
                message: (error as Error)?.message,
                url: url,
            });
        } finally {
            clearTimeout(abortTimeout);
        }
    }

    static tryParse<Type>(
        response: Response,
    ): Promise<Type | null> {
        return response
            .json()
            .catch(() => null);
    }
}