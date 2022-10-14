import { Base } from '../structures/Base';
import { Timeout } from '../structures/Timeout';

export class Errors extends Base {
    public isGlobal: boolean;

    public readonly abort: Timeout;

    public readonly http: Timeout;

    public readonly generic: Timeout;

    public readonly rateLimit: Timeout;

    public constructor() {
        super();

        this.isGlobal = false;

        this.abort = new Timeout({ baseTimeout: 0 });
        this.generic = new Timeout({ baseTimeout: 30_000 });
        this.http = new Timeout({ baseTimeout: 180_000 });
        this.rateLimit = new Timeout({ baseTimeout: 180_000 });

        this.addAbort = this.addAbort.bind(this);
        this.addGeneric = this.addGeneric.bind(this);
        this.addHTTP = this.addHTTP.bind(this);
        this.addRateLimit = this.addRateLimit.bind(this);
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

    public addRateLimit() {
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
                this.abort.getPauseFor(),
                this.generic.getPauseFor(),
                this.http.getPauseFor(),
                this.rateLimit.getPauseFor(),
            )
            : 0;
    }
}