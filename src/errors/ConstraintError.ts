import type { Locale } from '../@types/locales';

export class ConstraintError extends Error {
    public readonly cooldown?: number;

    public constructor(message: keyof Locale['errors']['constraintErrors'], cooldown?: number) {
        super(message);
        this.name = 'ConstraintError';
        this.cooldown = cooldown;

        // Thank you to https://www.dannyguo.com/blog/how-to-fix-instanceof-not-working-for-custom-errors-in-typescript/
        Object.setPrototypeOf(this, ConstraintError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}