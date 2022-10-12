import { AbortError } from './AbortError';
import { BaseErrorHandler } from './BaseErrorHandler';
import { type Core } from '../core/Core';
import { ErrorHandler } from './ErrorHandler';
import { HTTPError } from './HTTPError';

export class RequestErrorHandler<E> extends BaseErrorHandler<E> {
    public readonly core: Core;

    public constructor(error: E, core: Core) {
        super(error);
        this.core = core;

        const { errors: coreErrors } = this.core;

        if (this.error instanceof AbortError) {
            coreErrors.addAbort();
        } else if (this.error instanceof HTTPError) {
            coreErrors.addHTTP();
        } else {
            coreErrors.addGeneric();
        }
    }

    public init() {
        try {
            if (this.error instanceof AbortError) {
                this.log(this.error.name);
            } else {
                this.log(this.error);
            }

            this.sentry
                .setSeverity('warning')
                .requestContext(this.error, this.core)
                .captureException(this.error);
        } catch (error) {
            new ErrorHandler(error, this.incidentId).init();
        }
    }
}