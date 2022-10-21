import { BaseErrorHandler } from './BaseErrorHandler';

export class BaseRequestErrorHandler<E> extends BaseErrorHandler<E> {
    public constructor(error: E) {
        super(error);
        this.sentry.requestContext(this.error);
    }
}
