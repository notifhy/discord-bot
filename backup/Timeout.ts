import {
    clearTimeout,
    setTimeout,
} from 'node:timers';
import { GaxiosError } from 'gaxios';
import { Log } from '../src/util/Log';
import ErrorHandler from '../src/errors/handlers/ErrorHandler';

export default class Timeout {
    clearTimeout: number | undefined;
    pauseFor: number;
    resumeAfter: number;
    timeout: number;

    constructor() {
        this.clearTimeout = undefined;
        this.pauseFor = 0;
        this.resumeAfter = 0;
        this.timeout = 0;

        this.addError = this.addError.bind(this);
        this.isTimeout = this.isTimeout.bind(this);
        this.filterError = this.filterError.bind(this);
    }

    addError() {
        this.pauseFor = this.timeout;
        this.resumeAfter = this.timeout + Date.now();

        this.timeout = (this.timeout ** 1.5) || 30_000;

        if (this.clearTimeout) {
            clearTimeout(this.clearTimeout);
        }

        this.clearTimeout = setTimeout(() => {
            this.timeout = 0;
        }, this.timeout + 30_000) as unknown as number;
    }

    isTimeout() {
        return this.resumeAfter > Date.now();
    }

    async filterError(error: unknown) {
        if (error instanceof GaxiosError) {
            const code = Number(error.code);
            Log.log(`Ran into a ${code}`);

            if (
                code >= 500 ||
                code === 429 ||
                code === 408
            ) {
                this.addError();
                Log.log(`Added timeout, pausing for ${this.pauseFor}ms`);
                return;
            }
        }

        Log.log('Unrecoverable error. Ending process.');

        await ErrorHandler.init(error);

        process.exit(1);
    }
}