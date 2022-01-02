import type { Client } from 'discord.js';
import type { EventProperties } from '../@types/client';
import { SQLite } from '../util/SQLite';
import Constants from '../util/Constants';
import ErrorHandler from '../util/errors/handlers/ErrorHandler';

export const properties: EventProperties = {
    name: 'ready',
    once: true,
};

export const execute = async (client: Client) => {
    console.log(`Logged in as ${client?.user?.tag}!`);

    setActivity();

    setInterval(setActivity, Constants.ms.hour);

    async function setActivity() {
        try {
            let label: string;
            if (client.customStatus) {
                label = client.customStatus;
            } else {
                const users = (
                    await SQLite.getAllUsers({
                        table: 'api',
                        columns: ['discordID'],
                    })
                ).length;

                label = `${users} accounts | /register /help | ${client.guilds.cache.size} servers`; //Move to constants?
            }

            client.user?.setActivity({
                type: 'WATCHING',
                name: label,
            });
        } catch (error) {
            await new ErrorHandler(error).systemNotify();
        }
    }

    await client.hypixelAPI.forever(); //eslint-disable-line no-await-in-loop
};
