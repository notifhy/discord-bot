import { setTimeout } from 'node:timers';
import fetch, {
    RequestInit,
    Response,
} from 'node-fetch';
import AbortError from '../NotifHy/errors/AbortError';
import { Log } from './Log';

export class Request {
    readonly abortThreshold: number;
    readonly maxTries: number;
    private try: number;

    constructor(config?: {
        maxRetries?: number,
        abortThreshold?: number,
    }) {
        this.abortThreshold = config?.abortThreshold ?? 2500;
        this.maxTries = (config?.maxRetries ?? 2) + 1;
        this.try = 0;
    }

    async request(url: string, fetchOptions?: RequestInit): Promise<Response> {
        this.try += 1;

        const controller = new AbortController();
        const abortTimeout = setTimeout(
            () => controller.abort(),
            this.abortThreshold,
        ).unref();

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                ...fetchOptions,
            });


            if (response.ok) {
                if (this.try > 1) {
                    Log.debug('[REQUEST] Successfully fetched after a retry');
                }

                return response;
            }

            if (
                this.try < this.maxTries &&
                response.status >= 500 &&
                response.status < 600
            ) {
                Log.debug('[REQUEST] Retrying due to a response between 500 and 600');
                return this.request(url, fetchOptions);
            }

            return response;
        } catch (error) {
            if (this.try < this.maxTries) {
                Log.debug('[REQUEST] Retrying due to an AbortError');
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