import type { EventProperties } from '../@types/client';
import type { Guild } from 'discord.js';
import { formattedUnix } from '../util/utility';

export const properties: EventProperties = {
  name: 'guildDelete',
  once: false,
  hasParameter: true,
};

export const execute = (guild: Guild): void => {
  if (guild.available === false || !guild.client.isReady()) return;
  console.log(`${formattedUnix({ date: true, utc: true })} | Bot has left a guild; joined ${formattedUnix({ ms: guild.joinedTimestamp, date: true, utc: true })}. Guild: ${guild.name} | ${guild.id} Guild Owner: ${guild.ownerId} Guild Member Count: ${guild.memberCount - 1} (new count)`);
};