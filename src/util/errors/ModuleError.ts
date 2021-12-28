export default class ModuleError extends Error {
    readonly module: string;

    constructor({
        error,
        module,
    }: {
        error: unknown;
        module: string;
    }) {
        super((error as Error)?.message);
        this.name = error instanceof Error ? `ModuleError [${error.name}]` : 'ModuleError';
        this.module = module;

        Object.setPrototypeOf(this, ModuleError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
