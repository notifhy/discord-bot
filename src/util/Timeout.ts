import {
    clearTimeout,
    setTimeout,
} from 'node:timers';
import GlobalConstants from '../util/Constants';

type TimeoutOptions = {
    baseTimeout?: number,
    increment?: (current: number) => number,
    maxTimeout?: number,
}

export default class Timeout {
    private timeout: {
        baseTimeout: number,
        clearTimeout: number | undefined;
        lastMinute: number,
        maxTimeout: number,
        pauseFor: number;
        resumeAfter: number;
        timeout: number;
    };

    private increment: TimeoutOptions['increment'] | undefined;

    constructor(options?: TimeoutOptions) {
        this.timeout = {
            baseTimeout: GlobalConstants.ms.minute,
            clearTimeout: undefined,
            lastMinute: 0,
            maxTimeout: GlobalConstants.ms.day / 2,
            pauseFor: 0,
            resumeAfter: 0,
            timeout: GlobalConstants.ms.minute,
        };

        this.increment = options?.increment;

        if (options?.maxTimeout) {
            this.timeout.maxTimeout = options.maxTimeout;
        }

        if (options?.baseTimeout) {
            this.timeout.baseTimeout = options.baseTimeout;
            this.timeout.timeout = options.baseTimeout;
        }

        this.addError = this.addError.bind(this);
        this.isTimeout = this.isTimeout.bind(this);
        this.getPauseFor = this.getPauseFor.bind(this);
        this.getTimeout = this.getTimeout.bind(this);
    }

    addError() {
        this.timeout.pauseFor = this.timeout.timeout;
        this.timeout.resumeAfter = this.timeout.timeout + Date.now();

        const baseTimeout = Math.max(
            this.increment
                ? this.increment(this.timeout.timeout)
                : (this.timeout.timeout * 2),
            this.timeout.baseTimeout,
        );

        this.timeout.timeout = Math.min(
            baseTimeout,
            this.timeout.maxTimeout,
        );

        clearTimeout(this.timeout.clearTimeout);

        this.timeout.clearTimeout = setTimeout(() => {
            this.timeout.timeout = this.timeout.baseTimeout;
        }, this.timeout.timeout + 30_000) as unknown as number;
    }

    getPauseFor() {
        return this.timeout.pauseFor;
    }

    getTimeout() {
        return this.timeout;
    }

    isTimeout() {
        return this.timeout.resumeAfter > Date.now();
    }

    resetTimeout() {
        clearTimeout(this.timeout.clearTimeout);
        this.timeout.timeout = this.timeout.baseTimeout;
    }
}