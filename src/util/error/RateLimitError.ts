import { HTTPError } from './HTTPError';
import { Response } from 'node-fetch';
import { HypixelAPI } from '../../@types/hypixel';

export class RateLimitError extends HTTPError {
  constructor({
    message,
    json,
    response,
  }: {
    message?: string | undefined,
    json: HypixelAPI | null,
    response: Response,
  }) {
    super({ message, json, response });
    this.name = 'RateLimitError';

    Object.setPrototypeOf(this, RateLimitError.prototype);
    //Error.captureStackTrace(this, this.constructor);
  }
}