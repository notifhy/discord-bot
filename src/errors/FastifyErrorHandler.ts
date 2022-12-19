import type { FastifyError } from 'fastify';
import { BaseErrorHandler } from './BaseErrorHandler';

export class FastifyErrorHandler extends BaseErrorHandler<FastifyError> {
    public constructor(error: FastifyError) {
        super(error);
    }

    public init() {
        this.log(this.error);

        this.sentry
            .fastifyContext(this.error)
            .captureException(this.error);
    }
}
