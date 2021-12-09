import { UserAPIData } from '../../@types/database';

export default class ModuleError extends Error {
    module: string;
    user: UserAPIData;

    constructor({
        message,
        module,
        user,
    }: {
        message?: string;
        module: string;
        user: UserAPIData;
    }) {
        super(message);
        this.name = 'ModuleError';
        this.module = module;
        this.user = user;

        Object.setPrototypeOf(this, ModuleError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
