import { GlobalConstants } from '../../util/Constants';
import { RequestManager } from './RequestManager';
import { Timeout } from '../../util/Timeout';

export class HypixelErrors {
    request: RequestManager;

    readonly abort: Timeout;

    readonly rateLimit: Timeout;

    isGlobal: boolean;

    readonly error: Timeout;

    constructor(request: RequestManager) {
        this.request = request;

        this.isGlobal = false;

        this.abort = new Timeout({ baseTimeout: 0 });

        this.rateLimit = new Timeout({ baseTimeout: 30_000 });

        this.error = new Timeout({ baseTimeout: 30_000 });

        this.addAbort = this.addAbort.bind(this);
        this.addRateLimit = this.addRateLimit.bind(this);
        this.addError = this.addError.bind(this);
        this.isTimeout = this.isTimeout.bind(this);
        this.getTimeout = this.getTimeout.bind(this);
    }

    addAbort() {
        this.abort.addError();
    }

    addRateLimit({
        rateLimitGlobal,
        ratelimitReset,
    }: {
        rateLimitGlobal: boolean | null,
        ratelimitReset: string | null;
    }) {
        if (ratelimitReset) {
            this.rateLimit.timeout =
                (Number(ratelimitReset) + 1) * GlobalConstants.ms.second;
        }

        this.isGlobal = rateLimitGlobal ?? this.isGlobal;
        this.request.keyPercentage -= 0.05;
        this.rateLimit.addError();
    }

    addError() {
        this.error.addError();
    }

    isTimeout() {
        return this.abort.resumeAfter > Date.now() ||
            this.rateLimit.resumeAfter > Date.now() ||
            this.error.resumeAfter > Date.now();
    }

    getTimeout() {
        return this.isTimeout()
            ? Math.max(
                this.abort.pauseFor,
                this.rateLimit.pauseFor,
                this.error.pauseFor,
            )
            : 0;
    }
}