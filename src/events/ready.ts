import type { EventProperties } from '../@types/index';
import type { Client } from 'discord.js';

export const properties: EventProperties = {
  name: 'ready',
  once: true,
  hasParameter: false,
};

export const execute = (client: Client) => {
  console.log(`Logged in as ${client!.user?.tag}!`);
};