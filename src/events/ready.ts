import type { EventProperties } from '../@types/client';
import type { Client } from 'discord.js';
import { fatalWebhook, ownerID } from '../../config.json';
import { SQLiteWrapper } from '../database';
import { ErrorStackEmbed } from '../util/error/helper';
import { formattedUnix, sendWebHook } from '../util/utility';

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
      console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred |`, error);
      const incidentID = Math.random().toString(36).substring(2, 10).toUpperCase();
      const stackEmbed = new ErrorStackEmbed({ error: error, incidentID: incidentID });
      await sendWebHook({
        content: `<@${ownerID.join('><@')}>`,
        embeds: [stackEmbed],
        webhook: fatalWebhook,
        suppressError: true,
      });
    }
  }, 30_000);

  while (true) {
    await client.hypixelAPI.cycle(); //eslint-disable-line no-await-in-loop
  }
};