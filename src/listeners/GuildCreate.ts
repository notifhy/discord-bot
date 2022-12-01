import { Events, Listener } from '@sapphire/framework';
import type { Guild } from 'discord.js';
import { ErrorHandler } from '../errors/ErrorHandler';
import { setPresence } from '../utility/utility';

export class GuildCreateListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.GuildCreate,
        });
    }

    public async run(guild: Guild) {
        if (guild.available === false || !guild.client.isReady()) {
            return;
        }

        this.container.logger.info(
            this,
            `Guild's Id is ${guild.id}.`,
            `Guild owner's Id is ${guild.ownerId}.`,
            `New member count is ${guild.memberCount - 1}.`,
        );

        try {
            await setPresence();
        } catch (error) {
            new ErrorHandler(error).init();
        }
    }
}
