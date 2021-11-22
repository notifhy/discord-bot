import type { EventProperties } from '../@types/client';
import type { Guild } from 'discord.js';
import { formattedUnix } from '../util/utility';

export const properties: EventProperties = {
  name: 'guildCreate',
  once: false,
  hasParameter: true,
};

export const execute = async (guild: Guild): Promise<void> => {
  if (guild.available === false || !guild.client.isReady()) return;

  const time = formattedUnix({
    date: true,
    utc: true,
  });

  if (guild.client.config.blockedGuilds.includes(guild.id)) {
    try {
      console.log(`${time} | Bot has joined a blocked guild. Guild: ${guild.name} | ${guild.id} Guild Owner: ${guild.ownerId} Guild Member Count: ${guild.memberCount} (w/ bot)`);
      await guild.leave();
    } catch (error) {
      console.log(`${time} | Failed to auto leave a guild. Guild: ${guild.name} | ${guild.id}`);
    }
  } else {
    console.log(`${time} | Bot has joined a guild. Guild: ${guild.name} | ${guild.id} Guild Owner: ${guild.ownerId} Guild Member Count: ${guild.memberCount} (w/ bot)`);
  }
};