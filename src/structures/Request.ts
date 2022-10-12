import { setTimeout } from 'node:timers';
import { Base } from './Base';
import { AbortError } from '../errors/AbortError';
import { Options } from '../utility/Options';

export class Request extends Base {
    public readonly restRequestTimeout: number;

    private retry: number;

    public readonly retryLimit: number;

    public constructor(config?: {
        retryLimit?: number,
        restRequestTimeout?: number,
    }) {
        super();

        this.restRequestTimeout = config?.restRequestTimeout
            ?? Options.restRequestTimeout;

        this.retry = 0;

        this.retryLimit = config?.retryLimit ?? Options.retryLimit;
    }

    public async request(url: string, fetchOptions?: RequestInit): Promise<Response> {
        const controller = new AbortController();
        const abortTimeout = setTimeout(
            () => controller.abort(),
            this.restRequestTimeout,
        ).unref();

        try {
            const response = await fetch(url, {
                // Coerced due to a Typescript typings update to AbortController
                signal: controller.signal,
                ...fetchOptions,
            });

            if (response.ok === true) {
                if (this.retry >= 1) {
                    this.container.logger.warn(
                        `${this.constructor.name}:`,
                        'Successfully fetched after one or more retries.',
                    );
                }

                return response;
            }

            if (
                this.retry < this.retryLimit
                && response.status >= 500
                && response.status < 600
            ) {
                this.container.logger.warn(
                    `${this.constructor.name}:`,
                    `Retrying due to a response between 500 and 600: ${response.status}.`,
                );

                this.retry += 1;

                return await this.request(url, fetchOptions);
            }

            return response;
        } catch (error) {
            if (this.retry < this.retryLimit) {
                this.container.logger.warn(
                    `${this.constructor.name}:`,
                    'Retrying due to an AbortError.',
                );

                this.retry += 1;

                return await this.request(url, fetchOptions);
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
        return response
            .json()
            .catch(() => null);
    }
}