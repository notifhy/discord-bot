import type {
    Hypixel400_403_422,
    Hypixel429,
    HypixelAPIError,
    HypixelAPIOk,
} from '../@types/hypixel';
import type { Response } from 'node-fetch';
import { hypixelAPIkey } from '../../config.json';
import { Request } from './Request';
import HTTPError from './errors/HTTPError';
import RateLimitError from './errors/RateLimitError';

export class HypixelRequest {
    readonly maxAborts?: number;
    readonly abortThreshold?: number;

    constructor(
        init?: {
            maxAborts?: number,
            abortThreshold?: number,
        },
    ) {
        this.maxAborts = init?.maxAborts;
        this.abortThreshold = init?.abortThreshold;
    }

    async call(url: string): Promise<HypixelAPIOk> {
        const response = (
            await new Request({
                maxAborts: this.maxAborts,
                abortThreshold: this.abortThreshold,
            }).request(url, {
                headers: { 'API-Key': hypixelAPIkey },
            })
        );

        const JSON = (
            await Request.tryParse<
                HypixelAPIOk | HypixelAPIError
            >(response)
        );

        if (HypixelRequest.isHypixelAPIError(JSON, response)) {
            const baseErrorData = {
                message: JSON?.cause,
                response: response,
                url: url,
            };

            if (HypixelRequest.isRateLimit(JSON, response)) {
                throw new RateLimitError(
                    Object.assign(baseErrorData, { json: JSON }),
                );
            } else {
                throw new HTTPError<Hypixel400_403_422>(
                    Object.assign(baseErrorData, { json: JSON }),
                );
            }
        }

        //Data is all good!
        return JSON as HypixelAPIOk;
    }

    private static isHypixelAPIError = (
        json: HypixelAPIOk | HypixelAPIError | null,
        response: Response,
    ): json is HypixelAPIError | null =>
        response.ok === false || JSON === null;

    private static isRateLimit = (
        json: HypixelAPIError | null,
        response: Response,
    ): json is Hypixel429 | null =>
        response.status === 429;
}
