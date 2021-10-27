import type { HypixelAPI } from '../@types/hypixel';
import { AbortError, FetchError } from 'node-fetch';
import { Instance, RateLimit } from './RequestHelper';

export class RequestHandler {
  rateLimit: RateLimit;
  instance: Instance;

  constructor() {
    this.rateLimit = new RateLimit();
    this.instance = new Instance();
  }

  async request(url: string, options: object): Promise<object> {
    this.instance.sessionUses += 1;
    const controller = new AbortController();
    const abortTimeout = setTimeout(() => controller.abort(), 1000).unref();

    let response!: Response | AbortError | FetchError;

    try {
      response = await fetch(url, {
        signal: controller.signal,
        ...options,
      });
    } catch (err) {
      if (err instanceof AbortError || err instanceof FetchError) response = err;
      else throw err;
    } finally {
      clearTimeout(abortTimeout);
      return response;
    }
  }

  cleanRequest(input: Response | AbortError | FetchError) {
    if (input instanceof Response) {
      const json = tryParse(input) as HypixelAPI | null;

      if (input.ok === true && json !== null) {
        return json;
      }

      if (input.status === 429) {
        this.rateLimit.setRateLimit(true, json?.global ?? false, Date.now() + 60000);
        this.instance.isOK = false;
      }

      this.instance.addError();
      this.instance.isOK = false;
      throw input;
    } else if (input instanceof AbortError) {
      this.instance.addAbort();
      throw input;
    } else {
      this.instance.addError();
      throw input;
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