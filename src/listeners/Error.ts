import { Events, Listener } from '@sapphire/framework';
import { Sentry } from '../structures/Sentry';

export class ErrorListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.Error,
        });
    }

    public run(error: Error) {
        this.container.logger.error(this, error);

        new Sentry().setSeverity('error').captureException(error);
    }
}
