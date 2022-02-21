import type {
    HypixelAPI429,
    HypixelAPIError,
    HypixelAPINotOK,
    HypixelAPIOk,
} from '../NotifHy/@types/hypixel';
import { HTTPError } from '../NotifHy/errors/HTTPError';
import { hypixelAPIkey } from '../../config.json';
import { RateLimitError } from '../NotifHy/errors/RateLimitError';
import { Request } from './Request';

export class HypixelRequest {
    readonly config: {
        restRequestTimeout?: number,
        retryLimit?: number,
    } | undefined;

    constructor(
        config?: {
            restRequestTimeout?: number,
            retryLimit?: number,
        },
    ) {
        this.config = config;
    }

    async call(url: string): Promise<HypixelAPIOk> {
        const response = (
            await new Request({
                restRequestTimeout: this.config?.restRequestTimeout,
                retryLimit: this.config?.retryLimit,
            }).request(url, {
                headers: { 'API-Key': hypixelAPIkey },
            })
        );

        const JSON =
            await Request.tryParse<HypixelAPIOk | HypixelAPIError>(response);

        const status = response.status;

        if (response.ok) {
            return JSON as HypixelAPIOk;
        }

        const baseErrorData = {
            message: (JSON as HypixelAPINotOK)?.cause,
            response: response,
            url: url,
        };

        if (status === 429) {
            throw new RateLimitError(
                Object.assign(
                    baseErrorData,
                    { json: JSON as HypixelAPI429 },
                ),
            );
        } else {
            throw new HTTPError<HypixelAPIError>(
                Object.assign(
                    baseErrorData,
                    { json: JSON as HypixelAPIError },
                ),
            );
        }
    }
}