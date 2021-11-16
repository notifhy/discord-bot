import type { EventProperties } from '../@types/client';
import type { Client } from 'discord.js';
import { SQLiteWrapper } from '../database';
import errorHandler from '../util/error/errorHandler';

export const properties: EventProperties = {
  name: 'ready',
  once: true,
  hasParameter: false,
};

export const execute = async (client: Client) => {
  console.log(`Logged in as ${client!.user!.tag}!`);

  setInterval(async () => {
    try {
      if (client.customStatus === false) {
        const users = (await SQLiteWrapper.getAllUsers({
          table: 'api',
          columns: ['discordID'],
        })).length;

        client.user?.setActivity({
          type: 'WATCHING',
          name: `${users} accounts | /register /help | ${client.guilds.cache.size} servers`,
        });
      }
    } catch (error) {
      errorHandler({ error: error });
    }
  }, 30_000);

  while (true) {
    await client.hypixelAPI.cycle(); //eslint-disable-line no-await-in-loop
  }
};