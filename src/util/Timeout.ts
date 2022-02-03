import { Collection } from 'discord.js';
import {
    clearTimeout,
    setTimeout,
} from 'node:timers';
import { Log } from './Log';
import Constants from './Constants';

type TimeoutOptions = {
    baseTimeout: number,
}

type TimeoutType = {
    baseTimeout: number,
    clearTimeout: number | undefined;
    lastMinute: number,
    pauseFor: number;
    resumeAfter: number;
    timeout: number;
}

const defaultTimeout = {
    baseTimeout: Constants.ms.minute,
    clearTimeout: undefined,
    lastMinute: 0,
    pauseFor: 0,
    resumeAfter: 0,
    timeout: Constants.ms.minute,
};

const timeouts = new Collection<string, TimeoutType>();

export default class Timeout {
    key: string;

    constructor(key: string, options?: TimeoutOptions) {
        this.key = key;

        const config = { ...defaultTimeout };

        if (options?.baseTimeout) {
            config.baseTimeout = options.baseTimeout;
            config.timeout = options.baseTimeout;
        }

        timeouts.set(key, config);

        this.addError = this.addError.bind(this);
        this.isTimeout = this.isTimeout.bind(this);
        this.getPauseFor = this.getPauseFor.bind(this);
        this.getTimeout = this.getTimeout.bind(this);
    }

    addError() {
        const timeout = this.getTimeout();

        if (timeout === null) {
            //Log and send webhook
            Log.log('Timeout key invalid!', this.key);
            return;
        }

        timeout.pauseFor = timeout.timeout;
        timeout.resumeAfter = timeout.timeout + Date.now();

        timeout.timeout = (timeout.timeout * 2) || 30_000;

        clearTimeout(timeout.clearTimeout);

        timeouts.set(this.key, timeout);

        timeout.clearTimeout = setTimeout(() => {
            const timeoutNew = this.getTimeout();

            if (timeoutNew) {
                timeoutNew.timeout = 0;
                timeouts.set(this.key, timeoutNew);
            }
        }, timeout.timeout + 30_000) as unknown as number;
    }

    isTimeout() {
        const timeout = this.getTimeout();

        if (timeout === null) {
            return null;
        }

        return timeout.resumeAfter > Date.now();
    }

    getPauseFor() {
        return timeouts.get(this.key)?.pauseFor ?? null;
    }

    getTimeout() {
        return timeouts.get(this.key) ?? null;
    }
}