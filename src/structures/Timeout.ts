import { clearTimeout, setTimeout } from 'node:timers';
import { Time } from '../enums/Time';
import { Options } from '../utility/Options';

/* eslint-disable no-unused-vars */

type TimeoutOptions = {
    baseTimeout?: number;
    increment?: (current: number) => number;
    maxTimeout?: number;
    resetAfter?: number;
};

export class Timeout {
    private readonly baseTimeout: number;

    private clearTimeout: number | undefined;

    private lastHour: number;

    private readonly maxTimeout: number;

    private pauseFor: number;

    private resetAfter: number;

    private resumeAfter: number;

    private timeout: number;

    private readonly increment: TimeoutOptions['increment'] | undefined;

    constructor(options?: TimeoutOptions) {
        // Timeout set when the timeout is cleared
        this.baseTimeout = options?.baseTimeout ?? Options.timeoutBaseTimeout;

        // Holds a setTimeout Id for clearing
        // eslint-disable-next-line no-undefined
        this.clearTimeout = undefined;

        // Number of addError calls in the last hour
        this.lastHour = 0;

        // Upper limit to this.timeout
        this.maxTimeout = options?.maxTimeout ?? Options.timeoutMaxTimeout;

        // The value that would be used for a setTimeout
        this.pauseFor = 0;

        this.resetAfter = options?.resetAfter ?? Options.timeoutResetAfter;

        // Unix time for when a timeout should end
        this.resumeAfter = 0;

        // Holds the next timeout length
        this.timeout = options?.baseTimeout ?? Options.timeoutBaseTimeout;

        // Optional value to manipulate the increase in timeout
        this.increment = options?.increment;

        // Bindings
        this.addError = this.addError.bind(this);
        this.isTimeout = this.isTimeout.bind(this);
        this.getPauseFor = this.getPauseFor.bind(this);
        this.getTimeout = this.getTimeout.bind(this);
    }

    public addError() {
        this.pauseFor = this.timeout;
        this.resumeAfter = this.timeout + Date.now();

        const baseTimeout = Math.max(
            this.increment ? this.increment(this.timeout) : this.timeout * 2,
            this.baseTimeout,
        );

        this.timeout = Math.min(baseTimeout === 0 ? 30_000 : baseTimeout, this.maxTimeout);

        clearTimeout(this.clearTimeout);

        this.clearTimeout = setTimeout(() => {
            this.pauseFor = 0;
            this.timeout = this.baseTimeout;
        }, this.timeout * 1.25 + this.resetAfter) as unknown as number;

        this.lastHour += 1;

        setTimeout(() => {
            this.lastHour -= 1;
        }, Time.Hour);
    }

    public getLastHour() {
        return this.lastHour;
    }

    public getPauseFor() {
        return this.pauseFor;
    }

    public getResetAfter() {
        return this.resetAfter;
    }

    public getResumeAfter() {
        return this.resumeAfter;
    }

    public getTimeout() {
        return this.timeout;
    }

    public isTimeout() {
        return this.resumeAfter > Date.now();
    }

    public resetTimeout() {
        clearTimeout(this.clearTimeout);
        this.timeout = this.baseTimeout;
    }
}
