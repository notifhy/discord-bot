import type { Response } from 'node-fetch';

export default class HTTPError<JSON> extends Error {
  json: JSON | null;
  response: Response | undefined;
  status: number;
  statusText: string | undefined;
  url: string;

  constructor({
    name,
    message,
    json,
    response,
    url,
  }: {
    name: string,
    message: string,
    json?: JSON | null,
    response?: Response,
    url: string,
  }) {
    super(message ?? response?.statusText);
    this.name = `HTTPError [${name}]`;
    this.json = json ?? (response?.json().catch(() => null) as JSON | undefined) ?? null;
    this.response = response;
    this.status = response?.status ?? 500;
    this.statusText = response?.statusText;
    this.url = url;

    Object.setPrototypeOf(this, HTTPError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}