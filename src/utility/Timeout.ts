import {
    clearTimeout,
    setTimeout,
} from 'node:timers';
import { Constants } from './Constants';

/* eslint-disable no-unused-vars */

type TimeoutOptions = {
    baseTimeout?: number,
    increment?: (current: number) => number,
    maxTimeout?: number,
};

export class Timeout {
    private baseTimeout: number;

    private clearTimeout: number | undefined;

    public lastHour: number;

    private readonly maxTimeout: number;

    public pauseFor: number;

    public resumeAfter: number;

    public timeout: number;

    private readonly increment: TimeoutOptions['increment'] | undefined;

    constructor(options?: TimeoutOptions) {
        // Timeout set when the timeout is cleared
        this.baseTimeout = options?.baseTimeout ?? Constants.ms.minute;

        // Holds a setTimeout Id for clearing
        this.clearTimeout = undefined;

        // Number of addError calls in the last minute
        this.lastHour = 0;

        // Upper limit to this.timeout
        this.maxTimeout = options?.maxTimeout ?? Constants.ms.day / 2;

        // The value that would be used for a setTimeout
        this.pauseFor = 0;

        // Unix time for when a timeout should end
        this.resumeAfter = 0;

        // Holds the next timeout length
        this.timeout = options?.baseTimeout ?? Constants.ms.minute;

        // Optional value to manipulate the increase in timeout
        this.increment = options?.increment;

        // Bindings
        this.addError = this.addError.bind(this);
        this.isTimeout = this.isTimeout.bind(this);
        this.getPauseFor = this.getPauseFor.bind(this);
        this.getTimeout = this.getTimeout.bind(this);
    }

    addError() {
        this.pauseFor = this.timeout;
        this.resumeAfter = this.timeout + Date.now();

        const baseTimeout = Math.max(
            this.increment
                ? this.increment(this.timeout)
                : (this.timeout * 2),
            this.baseTimeout,
        );

        this.timeout = Math.min(
            baseTimeout === 0
                ? 30_000
                : baseTimeout,
            this.maxTimeout,
        );

        clearTimeout(this.clearTimeout);

        this.clearTimeout = setTimeout(() => {
            this.pauseFor = 0;
            this.timeout = this.baseTimeout;
        }, this.timeout + 30_000) as unknown as number;

        this.lastHour += 1;

        setTimeout(() => {
            this.lastHour -= 1;
        }, Constants.ms.hour);
    }

    getPauseFor() {
        return this.pauseFor;
    }

    getTimeout() {
        return this;
    }

    isTimeout() {
        return this.resumeAfter > Date.now();
    }

    resetTimeout() {
        clearTimeout(this.clearTimeout);
        this.timeout = this.baseTimeout;
    }
}