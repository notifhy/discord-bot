import type { EventProperties } from '../@types/index';
import type { Client } from 'discord.js';

export const properties: EventProperties = {
  name: 'ready',
  once: true,
  hasParameter: false,
};

export const execute = async (client: Client) => {
  console.log(`Logged in as ${client!.user!.tag}!`);

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    await client.hypixelAPI.loopMaker();
  }
};