import { Events, Listener } from '@sapphire/framework';
import { Sentry } from '../structures/Sentry';

export class WarnListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.Warn,
        });
    }

    public run(info: string) {
        this.container.logger.warn(`${this.constructor.name}:`, info);

        new Sentry().setSeverity('warning').captureException(info);
    }
}
