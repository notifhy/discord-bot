import type { HypixelAPI } from '../../@types/hypixel';
import type { Response } from 'node-fetch';

export class HTTPError extends Error {
  json: HypixelAPI | null;
  response: Response;
  status: number;
  statusText: string;
  url: string;

  constructor({
    message,
    json,
    response,
  }: {
    message?: string | undefined,
    json?: HypixelAPI | null,
    response: Response,
  }) {
    super(message ?? response.statusText);
    this.name = 'HTTPError';
    this.json = json ?? null;
    this.response = response;
    this.status = response?.status;
    this.statusText = response?.statusText;
    this.url = response?.url;

    Object.setPrototypeOf(this, HTTPError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}