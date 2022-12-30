import { Time } from '../enums/Time';
import { Base } from '../structures/Base';
import { Timeout } from '../structures/Timeout';

export class CoreErrors extends Base {
    public isGlobal: boolean;

    public readonly abort: Timeout;

    public readonly http: Timeout;

    public readonly generic: Timeout;

    public readonly rateLimit: Timeout;

    public constructor() {
        super();

        this.isGlobal = false;

        this.abort = new Timeout({ baseTimeout: 0, resetAfter: Time.Hour });
        this.generic = new Timeout({ baseTimeout: Time.Second * 30, resetAfter: Time.Hour });
        this.http = new Timeout({ baseTimeout: Time.Minute * 5, resetAfter: Time.Hour });
        this.rateLimit = new Timeout({ baseTimeout: Time.Minute * 5, resetAfter: Time.Hour });

        this.addAbort = this.addAbort.bind(this);
        this.addGeneric = this.addGeneric.bind(this);
        this.addHTTP = this.addHTTP.bind(this);
        this.addRateLimit = this.addRateLimit.bind(this);
        this.isTimeout = this.isTimeout.bind(this);
        this.getTimeout = this.getTimeout.bind(this);
    }

    public addAbort() {
        this.abort.add();
    }

    public addGeneric() {
        this.generic.add();
    }

    public addHTTP() {
        this.http.add();
    }

    public addRateLimit() {
        this.rateLimit.add();
    }

    public isTimeout() {
        return (
            this.abort.hasTimeout()
            || this.generic.hasTimeout()
            || this.http.hasTimeout()
            || this.rateLimit.hasTimeout()
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
