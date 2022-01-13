import { setTimeout } from 'node:timers';
import fetch, {
    RequestInit,
    Response,
} from 'node-fetch';
import AbortError from './errors/AbortError';

export class Request {
    aborts: number;
    readonly abortThreshold: number;
    readonly maxAborts: number;

    constructor(config?: {
        maxAborts?: number;
        abortThreshold?: number;
    }) {
        this.aborts = 0;
        this.abortThreshold = config?.abortThreshold ?? 2500;
        this.maxAborts = config?.maxAborts ?? 1;
    }

    async request(url: string, fetchOptions?: RequestInit): Promise<Response> {
        const controller = new AbortController();
        const abortTimeout = setTimeout(
            () => controller.abort(),
            this.abortThreshold,
        ).unref();

        try {
            return await fetch(url, {
                signal: controller.signal,
                ...fetchOptions,
            });
        } catch (error) {
            if (this.aborts < this.maxAborts) {
                this.aborts += 1;
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
