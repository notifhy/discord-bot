import { HTTPError } from './HTTPError';
import { Response } from 'node-fetch';
import { HypixelAPI } from '../../@types/hypixel';

export class RateLimitError extends HTTPError {
  json: HypixelAPI | null;

  constructor({
    message,
    status,
    json,
    path,
    uuid,
  }: {
    message?: string | undefined,
    status: number | string,
    json: HypixelAPI | null,
    path: string,
    uuid: string,
  }) {
    super({ message, status, path, uuid });
    this.name = 'RateLimitError';
    this.json = json;

    Object.setPrototypeOf(this, RateLimitError.prototype);
    //Error.captureStackTrace(this, this.constructor);
  }
}