import { AbortError } from './AbortError';
import { HTTPError } from './HTTPError';
import { RateLimitError } from './RateLimitError';
import { BaseErrorHandler } from './BaseErrorHandler';
import { type Core } from '../core/Core';
import { cleanLength } from '../utility/utility';
import { ErrorHandler } from './ErrorHandler';

export class RequestErrorHandler<E> extends BaseErrorHandler<E> {
    public readonly core: Core;

    public readonly timeout: string | null;

    public constructor(error: E, core: Core) {
        super(error);
        this.core = core;

        const { error: coreErrors } = this.core;

        if (this.error instanceof AbortError) {
            coreErrors.addAbort();
        } else if (this.error instanceof RateLimitError) {
            coreErrors.addRatelimit({
                rateLimitGlobal: this.error.json?.global ?? null,
                rateLimitReset: this.error.response?.headers?.get('rateLimit-reset') ?? null,
            });
        } else if (this.error instanceof HTTPError) {
            coreErrors.addHTTP();
        } else {
            coreErrors.addGeneric();
        }

        const resumeAfter = coreErrors.getTimeout();

        this.timeout = cleanLength(resumeAfter, true);
    }

    public static async init<T>(error: T, core: Core) {
        const handler = new RequestErrorHandler(error, core);

        try {
            handler.errorLog();
            await handler.systemNotify();
        } catch (error2) {
            await ErrorHandler.init(error2, handler.incidentID);
        }
    }

    private errorLog() {
        if (this.error instanceof AbortError) {
            this.log(this.error.name);
        } else {
            this.log(this.error);
        }
    }

    private async systemNotify() {
        this.sentry
            .setSeverity('warning')
            .requestContext(this.error, this.core)
            .captureException(this.error);
    }
}