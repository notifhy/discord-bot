import type { EventProperties } from '../@types/client';
import type { Guild } from 'discord.js';
import { formattedUnix } from '../util/utility';
import { SQLiteWrapper } from '../database';
import ErrorHandler from '../util/errors/ErrorHandler';

export const properties: EventProperties = {
    name: 'guildCreate',
    once: false,
};

export const execute = async (guild: Guild): Promise<void> => {
    if (guild.available === false || !guild.client.isReady()) {
        return;
    }

    const time = formattedUnix({
        date: true,
        utc: true,
    });

    if (guild.client.config.blockedGuilds.includes(guild.id)) {
        try {
            console.log(
                `${time} | Bot has joined a blocked guild. Guild: ${guild.name} | ${guild.id} Guild Owner: ${guild.ownerId} Guild Member Count: ${guild.memberCount} (w/ bot)`,
            );
            await guild.leave();
        } catch (error) {
            console.error(
                `${time} | Failed to auto leave a guild. Guild: ${guild.name} | ${guild.id}`,
            );
            await new ErrorHandler({ error: error }).systemNotify();
        }
    } else {
        console.log(
            `${time} | Bot has joined a guild. Guild: ${guild.name} | ${guild.id} Guild Owner: ${guild.ownerId} Guild Member Count: ${guild.memberCount} (w/ bot)`,
        );
    }

    try {
        const users = (
            await SQLiteWrapper.getAllUsers({
                table: 'api',
                columns: ['discordID'],
            })
        ).length;

        guild.client.user!.setActivity({
            type: 'WATCHING',
            name: `${users} accounts | /register /help | ${guild.client.guilds.cache.size} servers`,
        });
    } catch (error) {
        await new ErrorHandler({ error: error }).systemNotify();
    }
};
