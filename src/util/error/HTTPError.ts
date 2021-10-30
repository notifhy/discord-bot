export class HTTPError extends Error {
  status: number | string;
  path: string;
  uuid: string;

  constructor({
    message,
    status,
    path,
    uuid,
  }: {
    message?: string | undefined,
    status: number | string,
    path: string,
    uuid: string,
  }) {
    super(message);
    this.name = 'HTTPError';
    this.status = status;
    this.path = path;
    this.uuid = uuid;

    Object.setPrototypeOf(this, HTTPError.prototype);
    //Error.captureStackTrace(this, this.constructor);
  }
}