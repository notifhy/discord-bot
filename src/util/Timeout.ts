import {
    clearTimeout,
    setTimeout,
} from 'node:timers';
import Constants from '../NotifHy/util/Constants';

type TimeoutOptions = {
    baseTimeout?: number,
    increment?: (current: number) => number,
}

export default class Timeout {
    private timeout: {
        baseTimeout: number,
        clearTimeout: number | undefined;
        lastMinute: number,
        pauseFor: number;
        resumeAfter: number;
        timeout: number;
    };

    private increment: TimeoutOptions['increment'] | undefined;

    constructor(options?: TimeoutOptions) {
        this.timeout = {
            baseTimeout: Constants.ms.minute,
            clearTimeout: undefined,
            lastMinute: 0,
            pauseFor: 0,
            resumeAfter: 0,
            timeout: Constants.ms.minute,
        };

        this.increment = options?.increment;

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

        this.timeout.timeout = (
            this.increment
            ? this.increment(this.timeout.timeout)
            : (this.timeout.timeout * 2)
        ) || this.timeout.baseTimeout;

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