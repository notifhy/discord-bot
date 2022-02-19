import type { Client } from 'discord.js';
import type { ClientEvent } from '../@types/client';
import { ErrorHandler } from '../../utility/errors/ErrorHandler';
import { GlobalConstants } from '../../utility/Constants';
import { Log } from '../../utility/Log';
import { setActivity } from '../utility/utility';

export const properties: ClientEvent['properties'] = {
    name: 'ready',
    once: true,
};

export const execute: ClientEvent['execute'] = async (client: Client) => {
    Log.log(`Logged in as ${client?.user?.tag}!`);

    set();

    setInterval(set, GlobalConstants.ms.hour);

    async function set() {
        try {
            await setActivity(client);
        } catch (error) {
            await ErrorHandler.init(error);
        }
    }

    await client.hypixel.ready(); //eslint-disable-line no-await-in-loop
};