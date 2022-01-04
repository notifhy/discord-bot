import type { EventProperties } from '../@types/client';
import type { Guild } from 'discord.js';
import { formattedUnix } from '../util/utility';
import { Log } from '../util/Log';
import { SQLite } from '../util/SQLite';
import ErrorHandler from '../util/errors/handlers/ErrorHandler';

export const properties: EventProperties = {
    name: 'guildDelete',
    once: false,
};

export const execute = async (guild: Guild): Promise<void> => {
    if (
        guild.available === false ||
        !guild.client.isReady()
    ) {
        return;
    }

    const joinedAt = formattedUnix({
        ms: guild.joinedTimestamp,
        date: true,
        utc: true,
    });

    Log.log(
        `Bot has left a guild; joined ${joinedAt}. Guild: ${
            guild.name
        } | ${guild.id} Guild Owner: ${guild.ownerId} Guild Member Count: ${
            guild.memberCount - 1
        } (new count)`,
    );

    try {
        const users = (
            await SQLite.getAllUsers({
                table: 'api',
                columns: ['discordID'],
            })
        ).length;

        guild.client.user!.setActivity({
            type: 'WATCHING',
            name: `${users} accounts | /register /help | ${guild.client.guilds.cache.size} servers`,
        });
    } catch (error) {
        await new ErrorHandler(error).systemNotify();
    }
};
