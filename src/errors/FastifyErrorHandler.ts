import type { FastifyError } from 'fastify';
import { BaseErrorHandler } from './BaseErrorHandler';

export class FastifyErrorHandler extends BaseErrorHandler<FastifyError> {
    public constructor(error: FastifyError) {
        super(error);
    }

    public init() {
        this.sentry.fastifyContext(this.error);
        this.report();
    }
}
