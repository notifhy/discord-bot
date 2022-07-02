import type {
    HypixelAPI429,
    HypixelAPIError,
    HypixelAPINotOK,
    HypixelAPIOk,
} from '../@types/hypixel';
import { HTTPError } from '../errors/HTTPError';
import { RateLimitError } from '../errors/RateLimitError';
import { Request } from './Request';

export class HypixelRequest {
    public readonly config: {
        restRequestTimeout?: number,
        retryLimit?: number,
    } | undefined;

    public constructor(
        config?: {
            restRequestTimeout?: number,
            retryLimit?: number,
        },
    ) {
        this.config = config;
    }

    public async call(url: string): Promise<HypixelAPIOk> {
        const response = await new Request({
            restRequestTimeout: this.config?.restRequestTimeout,
            retryLimit: this.config?.retryLimit,
        }).request(url, {
            headers: { 'API-Key': process.env.HYPIXEL_API_KEY! },
        });

        const JSON = await Request.tryParse<
        HypixelAPIOk | HypixelAPIError
        >(response);

        const { status } = response;

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