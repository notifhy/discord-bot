export class HTTPError extends Error {
  status: number | string;
  path: string;

  constructor({
    message,
    status,
    path,
  }: {
    message?: string | undefined,
    status: number | string,
    path: string,
  }) {
    super(message);
    this.name = 'HTTPError';
    this.status = status;
    this.path = path;

    Object.setPrototypeOf(this, HTTPError.prototype);
    //Error.captureStackTrace(this, this.constructor);
  }
}