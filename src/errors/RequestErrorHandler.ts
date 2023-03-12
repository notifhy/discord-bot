import { AbortError } from './AbortError';
import { BaseErrorHandler } from './BaseErrorHandler';
import { ErrorHandler } from './ErrorHandler';
import { HTTPError } from './HTTPError';

export class RequestErrorHandler<E> extends BaseErrorHandler<E> {
    public constructor(error: E) {
        super(error);

        if (this.error instanceof AbortError || this.error instanceof HTTPError) {
            this.sentry.setSeverity('warning');
        }
    }

    public init() {
        try {
            if (this.error instanceof AbortError) {
                this.log(this.error.name);
                this.sentry.captureException(this.error);
            } else {
                this.report();
            }
        } catch (error) {
            new ErrorHandler(error, this.incidentId).init();
        }
    }
}
