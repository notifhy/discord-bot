import { setTimeout } from 'node:timers';
import fetch, {
    RequestInit,
    Response,
} from 'node-fetch';
import AbortError from '../NotifHy/errors/AbortError';
import { Log } from './Log';

export class Request {
    retries: number;
    readonly abortThreshold: number;
    readonly maxRetries: number;

    constructor(config?: {
        maxRetries?: number,
        abortThreshold?: number,
    }) {
        this.retries = 0;
        this.abortThreshold = config?.abortThreshold ?? 2500;
        this.maxRetries = config?.maxRetries ?? 2;
    }

    async request(url: string, fetchOptions?: RequestInit): Promise<Response> {
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
                if (this.retries > 0) {
                    Log.debug('[REQUEST] Successfully fetched after a retry');
                }

                return response;
            } else if (
                this.retries < this.maxRetries &&
                response.status >= 500 && response.status < 600
            ) {
                Log.debug('[REQUEST] Retrying due to a response between 500 and 600');
                this.retries += 1;
                return this.request(url, fetchOptions);
            }

            return response;
        } catch (error) {
            if (this.retries < this.maxRetries) {
                Log.debug('[REQUEST] Retrying due to an AbortError');
                this.retries += 1;
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

    static async tryParse<Type>(
        response: Response,
    ): Promise<Type | null> {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }
}