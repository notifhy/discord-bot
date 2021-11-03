import type { HypixelAPI } from '../../@types/hypixel';
import type { Response } from 'node-fetch';

export class HTTPError extends Error {
  json: HypixelAPI | null;
  response: Response;
  status: number;
  url: string;

  constructor({
    message,
    json,
    response,
  }: {
    message?: string | undefined,
    json: HypixelAPI | null,
    response: Response,
  }) {
    super(message);
    this.name = 'HTTPError';
    this.json = json;
    this.response = response;
    this.status = response.status;
    this.url = response.url;

    Object.setPrototypeOf(this, HTTPError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}