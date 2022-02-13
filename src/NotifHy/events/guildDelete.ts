import type { ClientEvent } from '../@types/client';
import type { Guild } from 'discord.js';
import type { UserAPIData } from '../@types/database';
import { Constants } from '../util/Constants';
import { ErrorHandler } from '../../util/errors/ErrorHandler';
import { formattedUnix } from '../../util/utility';
import { Log } from '../../util/Log';
import { SQLite } from '../../util/SQLite';

export const properties: ClientEvent['properties'] = {
    name: 'guildDelete',
    once: false,
};

export const execute: ClientEvent['execute'] = async (guild: Guild): Promise<void> => {
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
        guild.client.user!.setActivity({
            type: 'WATCHING',
            name: guild.client.customStatus ?? `${(
                await SQLite.getAllUsers<UserAPIData>({
                    table: Constants.tables.api,
                    columns: ['discordID'],
                })
            ).length} accounts | /register /help | ${guild.client.guilds.cache.size} servers`,
        });
    } catch (error) {
        await new ErrorHandler(error).systemNotify();
    }
};