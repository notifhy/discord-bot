import type { HypixelAPI } from '../@types/hypixel';
import { hypixelAPIkey } from '../../config.json';
import { AbortError, FetchError } from 'node-fetch';
import { RateLimitError } from './RateLimitError';
import { Instance, RateLimit } from './RequestHelper';

export class RequestHandler {
  instance: Instance;
  rateLimit: RateLimit;

  constructor() {
    this.instance = new Instance();
    this.rateLimit = new RateLimit();
  }

  async request(url: string, uuid: string, options?: object): Promise<HypixelAPI> {
    const controller = new AbortController();
    const abortTimeout = setTimeout(() => controller.abort(), 1000).unref();

    let response!: Response | AbortError | RateLimitError | FetchError;

    try {
      response = await fetch(url.replace(/%{}%/, uuid), {
        signal: controller.signal,
        headers: { 'API-Key': hypixelAPIkey },
        ...options,
      });
    } catch (err) {
      if (err instanceof AbortError ||
          err instanceof RateLimitError ||
          err instanceof FetchError) response = err;
    } finally {
      clearTimeout(abortTimeout);

      if (response instanceof Response) {
        const json = tryParse(response) as HypixelAPI | null;

        if (response.ok === true && json !== null) return json;

        if (response.status === 429) {
          const isGlobal = json?.global ?? false;
          this.instance.keyPercentage -= 1;
          this.instance.resumeAfter = isGlobal ? Date.now() + 150000 : Date.now() + 60000;
          this.instance.addError();
          this.rateLimit.rateLimit = true;
          this.rateLimit.isGlobal = isGlobal;
          this.rateLimit.cause = json?.cause ?? null;
          throw new RateLimitError();
        }

        this.instance.addError();
        throw response;
      }

      if (response instanceof AbortError) {
        this.instance.addAbort();
        if (this.instance.abortsLastMinute > 1) this.instance.resumeAfter = Date.now() + 30000;
      } else this.instance.addError();

      throw response;
    }

    function tryParse(json: Response) {
      try {
        return json.json();
      } catch (err) {
        return null;
      }
    }
  }
}