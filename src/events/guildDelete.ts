import type { EventProperties } from '../@types/client';
import type { Guild } from 'discord.js';
import { formattedUnix } from '../util/utility';

export const properties: EventProperties = {
  name: 'guildDelete',
  once: false,
};

export const execute = (guild: Guild): void => {
  if (guild.available === false || !guild.client.isReady()) return;

  const time = formattedUnix({
    date: true,
    utc: true,
  });

  const joinedAt = formattedUnix({
    ms: guild.joinedTimestamp,
    date: true,
    utc: true,
  });

  console.log(`${time} | Bot has left a guild; joined ${joinedAt}. Guild: ${guild.name} | ${guild.id} Guild Owner: ${guild.ownerId} Guild Member Count: ${guild.memberCount - 1} (new count)`);
};