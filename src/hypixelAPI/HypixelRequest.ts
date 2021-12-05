import type { Hypixel400_403_422, Hypixel429, HypixelAPIError, HypixelAPIOk } from '../@types/hypixel';
import type { Response } from 'node-fetch';
import { hypixelAPIkey } from '../../config.json';
import { Request } from '../util/Request';
import HTTPError from '../util/error/HTTPError';
import RateLimitError from '../util/error/RateLimitError';
import { HypixelModuleInstance } from './HypixelModuleInstance';

export class HypixelRequest {
  instance: HypixelModuleInstance;

  constructor(instance: HypixelModuleInstance) {
    this.instance = instance;
  }

  async call(url: string): Promise<HypixelAPIOk> {
    this.instance.instanceUses += 1;

    const response: Response = await new Request({
      maxAborts: this.instance.maxAborts,
      abortThreshold: this.instance.abortThreshold,
    }).request(url, {
      headers: { 'API-Key': hypixelAPIkey },
    }) as Response;

    const JSON = await tryParse(response);

    const isHypixelAPIError = (json: HypixelAPIOk | HypixelAPIError | null): json is HypixelAPIError =>
      response.ok === false || JSON === null;

    const isRateLimit = (json: HypixelAPIError): json is Hypixel429 =>
      response.status === 429;

    if (isHypixelAPIError(JSON)) { //typescript.
      const errorData = {
        name: response.statusText,
        message: JSON?.cause,
        response: response,
        url: url,
      };
      if (isRateLimit(JSON)) throw new RateLimitError(Object.assign(errorData, { json: JSON }));
      else throw new HTTPError<Hypixel400_403_422>(Object.assign(errorData, { json: JSON }));
    }

    //Data is all good!
    return JSON as HypixelAPIOk;

    async function tryParse(res: Response): Promise<HypixelAPIOk | HypixelAPIError | null> {
      try {
        return await res.json();
      } catch {
        return null;
      }
    }
  }
}