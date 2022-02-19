import type { UserAPIData } from '../@types/database';
import { Client } from 'discord.js';
import { Constants } from './Constants';
import { SQLite } from '../../util/SQLite';

export async function setActivity(client: Client) {
    const users = await SQLite.getAllUsers<UserAPIData>({
        table: Constants.tables.api,
        columns: ['discordID'],
    });

    let activity = client.customStatus;

    if (activity === null) {
        activity = Constants.defaults.presence();
        activity.name = activity.name
            ?.replace('{{ accounts }}', String(users.length))
            ?.replace('{{ servers }}', String(client.guilds.cache.size));
    }

    client.user?.setActivity(activity);
}