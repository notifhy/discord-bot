import type { Guild } from 'discord.js';
import { formattedNow } from '../util/utility';

export const name = 'guildDelete';
export const once = false;
export const parameter = true;

export const execute = (guild: Guild): void => {
  console.log(`${formattedNow({ date: true })} | Bot has left a guild; joined ${formattedNow({ ms: guild.joinedTimestamp, date: true })}. Guild: ${guild.name} | ${guild.id} Guild Owner: ${guild.ownerId} Guild Member Count: ${guild.memberCount - 1} (new count)`);
};