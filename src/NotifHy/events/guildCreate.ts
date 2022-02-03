import type { ClientEvent } from '../../@types/client';
import type { Guild } from 'discord.js';
import { Log } from '../../util/Log';
import { SQLite } from '../../util/SQLite';
import ErrorHandler from '../errors/handlers/ErrorHandler';

export const properties: ClientEvent['properties'] = {
    name: 'guildCreate',
    once: false,
};

export const execute: ClientEvent['execute'] = async (guild: Guild): Promise<void> => {
    if (
        guild.available === false ||
        !guild.client.isReady()
    ) {
        return;
    }

    if (guild.client.config.blockedGuilds.includes(guild.id)) {
        try {
            Log.log(
                `Bot has joined a blocked guild. Guild: ${guild.name} | ${guild.id} Guild Owner: ${guild.ownerId} Guild Member Count: ${guild.memberCount} (w/ bot)`,
            );

            await guild.leave();
        } catch (error) {
            Log.error(
                `Failed to auto leave a guild. Guild: ${guild.name} | ${guild.id}`,
            );

            await new ErrorHandler(error).systemNotify();
        }
    } else {
        Log.log(
            `Bot has joined a guild. Guild: ${guild.name} | ${guild.id} Guild Owner: ${guild.ownerId} Guild Member Count: ${guild.memberCount} (w/ bot)`,
        );
    }

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