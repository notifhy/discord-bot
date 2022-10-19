import { Events, Listener } from '@sapphire/framework';
import { Sentry } from '../structures/Sentry';

export class RateLimitListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.RateLimit,
        });
    }

    public run(rateLimitInfo: string) {
        this.container.logger.warn(`${this.constructor.name}:`, rateLimitInfo);

        new Sentry().setSeverity('warning').captureException(rateLimitInfo);
    }
}
