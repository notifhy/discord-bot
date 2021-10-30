import type { HypixelAPI } from '../@types/hypixel';
import { isAbortError } from '../util/error/helper';
import { RateLimitError } from '../util/error/RateLimitError';
import { hypixelAPIkey } from '../../config.json';
import fetch, { Response } from 'node-fetch';
import { AbortError, Instance, RateLimit } from './RequestHelper';

export class RequestHandler {
  instance: Instance;
  abortError: AbortError;
  rateLimit: RateLimit;

  constructor(instance: Instance, abortError: AbortError, rateLimit: RateLimit) {
    this.instance = instance;
    this.abortError = abortError;
    this.rateLimit = rateLimit;
  }

  async request(url: string, uuid: string, options?: object): Promise<Response | Error> {
    const controller = new AbortController();
    const abortTimeout = setTimeout(() => controller.abort(), 2500).unref();

    let response: Response | Error;
    try {
      response = await fetch(url.replace(/%{}%/, uuid), {
        signal: controller.signal,
        headers: { 'API-Key': hypixelAPIkey },
        ...options,
      });
    } catch (err) {
      if (err instanceof Error) response = err;
    } finally {
      clearTimeout(abortTimeout);
      //@ts-expect-error As far as I can tell, this is a sort of compiler error. "response" should always be defined.
      return response;
    }
  }

  async cleanRequest(response: Response | Error): Promise<HypixelAPI> {
    if (response instanceof Response) {
      const json = await tryParse(response) as HypixelAPI | null;

      if (response.ok === true && json !== null) return json;

      if (response.status === 429) {
        const isGlobal = json?.global ?? false;
        const timeoutLength = isGlobal ? 150000 : 60000;
        this.rateLimit.addRateLimitError();
        this.rateLimit.isGlobal = isGlobal;
        this.rateLimit.cause = json?.cause ?? null;
        this.instance.keyPercentage -= 1;
        this.instance.resumeAfter = this.instance.resumeAfter > Date.now()
          ? this.instance.resumeAfter! + timeoutLength
          : Date.now() + timeoutLength;
        throw new RateLimitError('Hit a 429');
      }

      this.instance.addUnusualError();
      throw response;
    }

    if (isAbortError(response)) {
      this.instance.addUnusualError();
      if (this.abortError.abortsLastMinute > 1) this.instance.resumeAfter = Date.now() + 30000;
    } else this.instance.addUnusualError();

    throw response;

    async function tryParse(jsonBody: Response) {
      try {
        const json = await jsonBody.json();
        return json;
      } catch (err) {
        return null;
      }
    }
  }
}