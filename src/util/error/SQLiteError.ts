export class SQLiteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SQLiteError';

    Object.setPrototypeOf(this, SQLiteError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
};