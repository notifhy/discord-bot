export class ModuleError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ModuleError';

    Object.setPrototypeOf(this, ModuleError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
};