import { HTTPError } from './HTTPError';
import { Hypixel429 } from '../../@types/hypixel';
import { Response } from 'node-fetch';

export class RateLimitError extends HTTPError<Hypixel429> {
  constructor({
    message,
    json,
    response,
  }: {
    message?: string | undefined,
    json: Hypixel429 | null,
    response: Response,
  }) {
    super({ message, json, response });
    this.name = 'RateLimitError';

    Object.setPrototypeOf(this, RateLimitError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}