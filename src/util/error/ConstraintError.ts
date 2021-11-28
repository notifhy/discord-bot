export default class ConstraintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConstraintError';

    //Thank you to https://www.dannyguo.com/blog/how-to-fix-instanceof-not-working-for-custom-errors-in-typescript/
    Object.setPrototypeOf(this, ConstraintError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}