import type { EventProperties } from '../@types/index';
import type { Client } from 'discord.js';
import { RequestCreate } from '../hypixelAPI/RequestCreate';
import { formattedUnix } from '../util/utility';

export const properties: EventProperties = {
  name: 'ready',
  once: true,
  hasParameter: false,
};

export const execute = async (client: Client) => {
  console.log(`Logged in as ${client!.user!.tag}!`);

  const urls: string[] = ['https://api.hypixel.net/player?uuid=%{}%'];

  while (true) {
    console.log(`${formattedUnix({ date: false, utc: true })}, ${client.hypixelAPI.instance.instanceUses}`);
    // eslint-disable-next-line no-await-in-loop
    await client.hypixelAPI.loopMaker(urls);
  }
};