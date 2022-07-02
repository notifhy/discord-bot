import { Constants } from '../utility/Constants';
import { Timeout } from '../utility/Timeout';

export class Error {
    public isGlobal: boolean;

    public readonly abort: Timeout;

    public readonly http: Timeout;

    public readonly rateLimit: Timeout;

    public readonly generic: Timeout;

    public constructor() {
        this.isGlobal = false;

        this.abort = new Timeout({ baseTimeout: 0 });
        this.generic = new Timeout({ baseTimeout: 30_000 });
        this.http = new Timeout({ baseTimeout: 30_000 });
        this.rateLimit = new Timeout({ baseTimeout: 30_000 });

        this.addAbort = this.addAbort.bind(this);
        this.addGeneric = this.addGeneric.bind(this);
        this.addHTTP = this.addHTTP.bind(this);
        this.addRatelimit = this.addRatelimit.bind(this);
        this.isTimeout = this.isTimeout.bind(this);
        this.getTimeout = this.getTimeout.bind(this);
    }

    public addAbort() {
        this.abort.addError();
    }

    public addGeneric() {
        this.generic.addError();
    }

    public addHTTP() {
        this.http.addError();
    }

    public addRatelimit({
        rateLimitGlobal,
        rateLimitReset,
    }: {
        rateLimitGlobal: boolean | null,
        rateLimitReset: string | null;
    }) {
        if (rateLimitReset !== null) {
            this.rateLimit.timeout = (Number(rateLimitReset) + 1) * Constants.ms.second;
        }

        this.isGlobal = rateLimitGlobal ?? this.isGlobal;
        this.rateLimit.addError();
    }

    public isTimeout() {
        return (
            this.abort.isTimeout()
            || this.generic.isTimeout()
            || this.http.isTimeout()
            || this.rateLimit.isTimeout()
        );
    }

    public getTimeout() {
        return this.isTimeout()
            ? Math.max(
                this.abort.pauseFor,
                this.generic.pauseFor,
                this.http.pauseFor,
                this.rateLimit.pauseFor,
            )
            : 0;
    }
}