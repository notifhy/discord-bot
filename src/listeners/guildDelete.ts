import { Events, Listener } from '@sapphire/framework';
import type { Guild } from 'discord.js';
import { ErrorHandler } from '../errors/ErrorHandler';
import { formattedUnix, setPresence } from '../utility/utility';

export class GuildDeleteListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.GuildDelete,
        });
    }

    public run(guild: Guild) {
        if (guild.available === false || !guild.client.isReady()) {
            return;
        }

        const joinedAt = formattedUnix({
            ms: guild.joinedTimestamp,
            date: true,
            utc: true,
        })!;

        this.container.logger.info(
            `${this.constructor.name}:`,
            `Originally joined ${joinedAt}.`,
            `Guild's Id is ${guild.id}.`,
            `Guild owner's Id is ${guild.ownerId}.`,
            `New member count is ${guild.memberCount - 1}.`,
        );

        try {
            setPresence();
        } catch (error) {
            new ErrorHandler(error).init();
        }
    }
}
