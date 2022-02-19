import type { ClientEvent } from '../@types/client';
import type { Guild } from 'discord.js';
import { ErrorHandler } from '../../utility/errors/ErrorHandler';
import { Log } from '../../utility/Log';
import { setActivity } from '../utility/utility';

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

            await ErrorHandler.init(error);
        }
    } else {
        Log.log(
            `Bot has joined a guild. Guild: ${guild.name} | ${guild.id} Guild Owner: ${guild.ownerId} Guild Member Count: ${guild.memberCount} (w/ bot)`,
        );
    }

    try {
        await setActivity(guild.client);
    } catch (error) {
        await ErrorHandler.init(error);
    }
};