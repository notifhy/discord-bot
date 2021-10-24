import type { Client } from 'discord.js';

export const name = 'ready';
export const once = true;
export const parameter = false;

export const execute = (client: Client): void => {
  console.log(`Logged in as ${client!.user?.tag}!`);
};