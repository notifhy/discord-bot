import type { Response } from 'node-fetch';

export default class HTTPError<JSON> extends Error {
  baseName: string |null;
  json: JSON | null;
  response: Response | undefined;
  status: number;
  statusText: string | undefined;
  url: string;

  constructor({
    baseName,
    inherited,
    json,
    message,
    response,
    url,
  }: {
    baseName?: string,
    inherited?: string,
    json?: JSON | null,
    message?: string,
    response?: Response,
    url: string,
  }) {
    super(message ?? response?.statusText);
    this.baseName = baseName ?? null;
    this.json = json ?? (response?.json().catch(() => null) as JSON | undefined) ?? null;
    this.name = inherited ? `HTTPError [${inherited}]` : 'HTTPError';
    this.response = response;
    this.status = response?.status ?? 500;
    this.statusText = response?.statusText;
    this.url = url;

    Object.setPrototypeOf(this, HTTPError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}