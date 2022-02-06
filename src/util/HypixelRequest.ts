import type {
    HypixelAPINotOK,
    HypixelAPI429,
    HypixelAPIError,
    HypixelAPIOk,
} from '../NotifHy/@types/hypixel';
import { hypixelAPIkey } from '../../config.json';
import { Request } from './Request';
import HTTPError from '../NotifHy/errors/HTTPError';
import RateLimitError from '../NotifHy/errors/RateLimitError';

export class HypixelRequest {
    readonly config: {
        maxRetries?: number,
        abortThreshold?: number,
    } | undefined;

    constructor(
        config?: {
            maxRetries?: number,
            abortThreshold?: number,
        },
    ) {
        this.config = config;
    }

    async call(url: string): Promise<HypixelAPIOk> {
        const response = (
            await new Request({
                maxRetries: this.config?.maxRetries,
                abortThreshold: this.config?.abortThreshold,
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