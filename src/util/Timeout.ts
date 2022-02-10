import {
    clearTimeout,
    setTimeout,
} from 'node:timers';
import { GlobalConstants } from '../util/Constants';

/* eslint-disable no-unused-vars */

type TimeoutOptions = {
    baseTimeout?: number,
    increment?: (current: number) => number,
    maxTimeout?: number,
}

export class Timeout {
    private baseTimeout: number;
    private clearTimeout: number | undefined;
    lastMinute: number;
    private maxTimeout: number;
    pauseFor: number;
    resumeAfter: number;
    timeout: number;

    private increment: TimeoutOptions['increment'] | undefined;

    constructor(options?: TimeoutOptions) {
        //Timeout set when the timeout is cleared
        this.baseTimeout = options?.baseTimeout ?? GlobalConstants.ms.minute;

        //Holds a setTimeout Id for clearing
        this.clearTimeout = undefined;

        //Number of addError calls int he last minute
        this.lastMinute = 0;

        //Upper limit to this.timeout
        this.maxTimeout = options?.maxTimeout ?? GlobalConstants.ms.day / 2;

        //The value that would be used for a setTimeout
        this.pauseFor = 0;

        //Unix time for when a timeout should end
        this.resumeAfter = 0;

        //Holds the next timeout length
        this.timeout = options?.baseTimeout ?? GlobalConstants.ms.minute;

        //Optional value to manipulate the increase in timeout
        this.increment = options?.increment;

        //Bindings
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

        this.lastMinute += 1;

        setTimeout(() => {
            this.lastMinute -= 1;
        }, GlobalConstants.ms.minute);
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