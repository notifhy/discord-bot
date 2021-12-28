import type {
    Hypixel400_403_422,
    Hypixel429,
    HypixelAPIError,
    HypixelAPIOk,
} from '../@types/hypixel';
import { hypixelAPIkey } from '../../config.json';
import { Request } from './Request';
import type { Response } from 'node-fetch';
import HTTPError from './errors/HTTPError';
import RateLimitError from './errors/RateLimitError';

export class HypixelRequest {
    readonly maxAborts?: number;
    readonly abortThreshold?: number;

    constructor(init?: { maxAborts?: number, abortThreshold?: number }) {
        this.maxAborts = init?.maxAborts;
        this.abortThreshold = init?.abortThreshold;
    }

    async call(url: string): Promise<HypixelAPIOk> {
        const response: Response = (await new Request({
            maxAborts: this.maxAborts,
            abortThreshold: this.abortThreshold,
        }).request(url, {
            headers: { 'API-Key': hypixelAPIkey },
        })) as Response;

        const JSON = await tryParse(response);

        const isHypixelAPIError = (
            json: HypixelAPIOk | HypixelAPIError | null,
        ): json is HypixelAPIError => response.ok === false || JSON === null;

        const isRateLimit = (json: HypixelAPIError): json is Hypixel429 =>
            response.status === 429;

        if (isHypixelAPIError(JSON)) {
            //typescript.
            const errorData = {
                message: JSON?.cause,
                response: response,
                url: url,
            };
            if (isRateLimit(JSON)) {
                throw new RateLimitError(
                    Object.assign(errorData, { json: JSON }),
                );
            } else {
                throw new HTTPError<Hypixel400_403_422>(
                    Object.assign(errorData, { json: JSON }),
                );
            }
        }

        //Data is all good!
        return JSON as HypixelAPIOk;

        async function tryParse(
            res: Response,
        ): Promise<HypixelAPIOk | HypixelAPIError | null> {
            try {
                return await res.json();
            } catch {
                return null;
            }
        }
    }
}
