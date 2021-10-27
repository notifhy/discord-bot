class HTTPError extends Error {
  constructor(message: string, error: Error) {
    super(message);
    this.name = 'HTTPError';

    Object.setPrototypeOf(this, HTTPError.prototype);
  }
}