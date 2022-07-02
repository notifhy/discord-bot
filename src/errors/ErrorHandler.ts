import { BaseErrorHandler } from './BaseErrorHandler';

export class ErrorHandler<E> extends BaseErrorHandler<E> {
    public data: string[];

    public constructor(error: E, ...data: string[]) {
        super(error);
        this.data = data;
    }

    public static async init<T>(error: T, ...data: string[]) {
        const handler = new ErrorHandler(error, ...data);
        handler.errorLog();
        await handler.systemNotify();
    }

    private errorLog() {
        this.log(this.error);

        if (this.data.length !== 0) {
            this.log(...this.data);
        }
    }

    async systemNotify() {
        this.sentry
            .setSeverity('error')
            .captureException(this.error)
            .captureMessages(...this.data);
    }
}