import { RequestManager } from './RequestManager';
import GlobalConstants from '../../util/Constants';
import Timeout from '../../util/Timeout';

export class HypixelErrors {
    request: RequestManager;

    resumeAfter: number;

    readonly abort: Timeout;

    readonly rateLimit: Timeout;

    isGlobal: boolean;

    readonly error: Timeout;

    constructor(request: RequestManager) {
        this.request = request;

        this.resumeAfter = 0;

        this.isGlobal = false;

        this.abort = new Timeout({ baseTimeout: 0 });

        this.rateLimit = new Timeout({ baseTimeout: 30_000 });

        this.error = new Timeout({ baseTimeout: 30_000 });
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
        return this.resumeAfter > Date.now();
    }

    getTimeout() {
        return this.isTimeout()
            ? this.resumeAfter - Date.now()
            : 0;
    }
}