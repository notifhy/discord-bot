import { formattedNow } from '../utility';
import type { Guild } from 'discord.js';

export const name = 'guildCreate';
export const once = false;
export const parameter = true;

export const execute = (guild: Guild): void => {
  console.log(`${formattedNow({ date: true })} | Bot has joined a guild. Guild: ${guild.name} | ${guild.id} Guild Owner: ${guild.ownerId} Guild Member Count: ${guild.memberCount} (w/ bot)`);
};