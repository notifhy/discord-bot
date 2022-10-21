import { AbortError } from './AbortError';
import type { Core } from '../core/Core';
import { ErrorHandler } from './ErrorHandler';
import { HTTPError } from './HTTPError';
import { RateLimitError } from './RateLimitError';
import { BaseRequestErrorHandler } from './BaseRequestErrorHandler';

export class CoreRequestErrorHandler<E> extends BaseRequestErrorHandler<E> {
    public readonly core: Core;

    public constructor(error: E, core: Core) {
        super(error);
        this.core = core;

        const { errors: coreErrors } = this.core;

        if (this.error instanceof AbortError) {
            coreErrors.addAbort();
            this.sentry.setSeverity('warning');
        } else if (this.error instanceof RateLimitError) {
            coreErrors.addRateLimit();
            this.sentry.setSeverity('error');
        } else if (this.error instanceof HTTPError) {
            coreErrors.addHTTP();
            this.sentry.setSeverity('warning');
        } else {
            coreErrors.addGeneric();
            this.sentry.setSeverity('error');
        }
    }

    public init() {
        try {
            if (this.error instanceof AbortError) {
                this.log(this.error.name);
            } else {
                this.log(this.error);
            }

            this.sentry.requestContextCore(this.core).captureException(this.error);
        } catch (error) {
            new ErrorHandler(error, this.incidentId).init();
        }
    }
}
