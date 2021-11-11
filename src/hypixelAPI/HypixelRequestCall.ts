import type { HypixelAPI, HypixelPlayerData } from '../@types/hypixel';
import type { Response } from 'node-fetch';
import { hypixelAPIkey } from '../../config.json';
import { RateLimitError } from '../util/error/RateLimitError';
import { HTTPError } from '../util/error/HTTPError';
import { Request } from './Request';
import { ModuleDataResolver } from './ModuleDataResolver';

export class HypixelRequestCall {
  async call(url: string, moduleDataResolver: ModuleDataResolver): Promise<HypixelPlayerData> {
    moduleDataResolver.instance.instanceUses += 1;
    const response: Response | HypixelAPI | null = await new Request({
      maxAborts: 1,
      abortThreshold: moduleDataResolver.instance.abortThreshold,
    }).request(url, {
      headers: { 'API-Key': hypixelAPIkey },
    }) as Response;

    const JSON = await tryParse(response);

    if (response.ok === false || JSON === null) {
      const errorData = {
        message: JSON?.cause,
        json: JSON,
        response: response,
      };
      if (response.status === 429) throw new RateLimitError(errorData);
      else throw new HTTPError(errorData);
    }

    //Data is all good!
    return JSON.player as HypixelPlayerData;

    async function tryParse(res: Response): Promise<HypixelAPI | null> {
      try {
        return await res.json();
      } catch {
        return null;
      }
    }
  }
}