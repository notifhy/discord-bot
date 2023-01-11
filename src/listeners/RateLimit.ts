import { container, Listener } from '@sapphire/framework';
import { RESTEvents } from 'discord.js';
import { Sentry } from '../structures/Sentry';

export class RateLimitListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            emitter: container.client.rest,
            once: false,
            event: RESTEvents.RateLimited,
        });
    }

    public run(rateLimitInfo: string) {
        this.container.logger.warn(this, rateLimitInfo);

        new Sentry().setSeverity('warning').captureMessages(rateLimitInfo);
    }
}
