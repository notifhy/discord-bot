import type { SeverityLevel } from '@sentry/node';
import { BaseErrorHandler } from './BaseErrorHandler';

export class ErrorHandler<E> extends BaseErrorHandler<E> {
    public constructor(error: E, ...data: string[]) {
        super(error, ...data);
    }

    public init(severity?: SeverityLevel) {
        if (severity) {
            this.sentry.setSeverity(severity);
        }

        this.report();
    }
}
