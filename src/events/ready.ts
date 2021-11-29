import type { Client } from 'discord.js';
import type { EventProperties } from '../@types/client';
import { SQLiteWrapper } from '../database';
import errorHandler from '../util/error/errorHandler';

export const properties: EventProperties = {
  name: 'ready',
  once: true,
};

export const execute = async (client: Client) => {
  console.log(`Logged in as ${client?.user?.tag}!`);

  setInterval(async () => {
    try {
      let label: string;
      if (client.customStatus) {
        label = client.customStatus;
      } else {
        const users = (await SQLiteWrapper.getAllUsers({
          table: 'api',
          columns: ['discordID'],
        })).length;

        label = `${users} accounts | /register /help | ${client.guilds.cache.size} servers`; //Move to locales etc?
      }

      client.user?.setActivity({
        type: 'WATCHING',
        name: label,
      });
    } catch (error) {
      await errorHandler({ error: error });
    }
  }, 30_000);

  while (true) {
    await client.hypixelAPI.cycle(); //eslint-disable-line no-await-in-loop
  }
};