import { SnowflakeUtil } from 'discord.js';
import { Log } from '../utility/Log';
import { Sentry } from './Sentry';

export class BaseErrorHandler<E> {
    public readonly error: E;

    public readonly incidentID: string;

    public readonly sentry: Sentry;

    public constructor(error: E) {
        this.error = error;
        this.incidentID = SnowflakeUtil.generate().toString();
        this.sentry = new Sentry().baseErrorContext(this.incidentID);
    }

    public log(...text: unknown[]) {
        const id = `Incident ${this.incidentID} |`;

        Log.error(id, ...text);
    }
}