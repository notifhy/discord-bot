import { container, Listener } from '@sapphire/framework';
import { RESTEvents } from 'discord.js';
import { Sentry } from '../structures/Sentry';

export class RateLimitedListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            emitter: container.client.rest,
            once: false,
            event: RESTEvents.RateLimited,
        });
    }

    public run(rateLimitedInfo: string) {
        this.container.logger.warn(this, rateLimitedInfo);

        new Sentry().setSeverity('warning').captureMessages(rateLimitedInfo);
    }
}
