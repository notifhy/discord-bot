export default class ModuleError extends Error {
    readonly cleanModule: string;
    readonly module: string;
    readonly raw: unknown;

    constructor({
        error,
        cleanModule,
        module,
    }: {
        error: unknown;
        cleanModule: string;
        module: string;
    }) {
        super((error as Error)?.message);
        this.cleanModule = cleanModule;
        this.module = module;
        this.name = error instanceof Error
            ? `ModuleError [${error.name}]`
            : 'ModuleError';

        if (error instanceof Error) {
            error.name = this.name;
        }

        this.raw = error;

        Object.setPrototypeOf(this, ModuleError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
