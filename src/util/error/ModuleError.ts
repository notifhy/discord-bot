export default class ModuleError extends Error {
  module: string;

  constructor({
    message,
    module,
  }: {
    message?: string,
    module: string,
  }) {
    super(message);
    this.name = 'ModuleError';
    this.module = module;

    Object.setPrototypeOf(this, ModuleError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}