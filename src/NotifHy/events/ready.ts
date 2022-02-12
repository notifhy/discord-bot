import type { Client } from 'discord.js';
import type { ClientEvent } from '../@types/client';
import { Constants } from '../util/Constants';
import { ErrorHandler } from '../../util/errors/ErrorHandler';
import { GlobalConstants } from '../../util/Constants';
import { Log } from '../../util/Log';
import { SQLite } from '../../util/SQLite';

export const properties: ClientEvent['properties'] = {
    name: 'ready',
    once: true,
};

export const execute: ClientEvent['execute'] = async (client: Client) => {
    Log.log(`Logged in as ${client?.user?.tag}!`);

    setActivity();

    setInterval(setActivity, GlobalConstants.ms.hour);

    async function setActivity() {
        try {
            let label: string;
            if (client.customStatus === null) {
                const users = (
                    await SQLite.getAllUsers({
                        table: Constants.tables.api,
                        columns: ['discordID'],
                    })
                ).length;

                label = `${users} accounts | /register /help | ${client.guilds.cache.size} servers`;
            } else {
                label = client.customStatus;
            }

            client.user?.setActivity({
                type: 'WATCHING',
                name: label,
            });
        } catch (error) {
            await new ErrorHandler(error).systemNotify();
        }
    }

    await client.hypixel.ready(); //eslint-disable-line no-await-in-loop
};