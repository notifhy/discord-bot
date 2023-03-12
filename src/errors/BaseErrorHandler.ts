import { SnowflakeUtil } from 'discord.js';
import { i18n } from '../locales/i18n';
import { Base } from '../structures/Base';
import { Sentry } from '../structures/Sentry';

export class BaseErrorHandler<E> extends Base {
    public readonly data: string[];

    public readonly error: E;

    public readonly incidentId: string;

    public readonly sentry: Sentry;

    public readonly i18n: i18n;

    public constructor(error: E, ...data: string[]) {
        super();

        this.data = data;
        this.error = error;
        this.i18n = new i18n();
        this.incidentId = SnowflakeUtil.generate().toString();
        this.sentry = new Sentry().setSeverity('error').baseErrorContext(this.incidentId);
    }

    public log(...text: unknown[]) {
        this.container.logger.error(this, `Incident ${this.incidentId}`, ...text);
    }

    public report() {
        this.log(this.error);

        if (this.data.length > 0) {
            this.log(...this.data);
        }

        this.sentry.captureException(this.error).captureMessages(...this.data);
    }
}
