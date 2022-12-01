import { setTimeout } from 'node:timers';
import { fetch, type RequestInit, type Response } from 'undici';
import { Base } from './Base';
import { AbortError } from '../errors/AbortError';
import { HTTPError } from '../errors/HTTPError';
import { RateLimitError } from '../errors/RateLimitError';

export class Request extends Base {
    public static async request(url: string, fetchOptions?: RequestInit) {
        return Request.requestHelper(0, url, fetchOptions);
    }

    private static async requestHelper(
        retries: number,
        url: string,
        fetchOptions?: RequestInit,
    ): Promise<Response> {
        const { requestTimeout, requestRetryLimit } = this.container.config;

        const controller = new AbortController();
        const abortTimeout = setTimeout(() => controller.abort(), requestTimeout).unref();

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                ...fetchOptions,
            });

            if (response.ok) {
                if (retries >= 1) {
                    this.container.logger.warn(
                        this,
                        'Successfully fetched after one or more retries.',
                    );
                }

                return response;
            }

            if (retries < requestRetryLimit && response.status >= 500 && response.status < 600) {
                this.container.logger.warn(
                    this,
                    `Retrying due to a response between 500 and 600: ${response.status}.`,
                );

                return await this.requestHelper(retries + 1, url, fetchOptions);
            }

            const baseErrorData = {
                response: response,
                url: url,
            };

            if (response.status === 429) {
                throw new RateLimitError(baseErrorData);
            }

            throw new HTTPError(baseErrorData);
        } catch (error) {
            if (retries < requestRetryLimit) {
                this.container.logger.warn(this, 'Retrying due to an AbortError.');

                return await this.requestHelper(retries + 1, url, fetchOptions);
            }

            throw new AbortError({
                message: (error as Error)?.message,
                url: url,
            });
        } finally {
            clearTimeout(abortTimeout);
        }
    }
}
