import type { CommandExecute, CommandProperties } from '../@types/client';
import { BetterEmbed, cleanLength } from '../util/utility';
import { CommandInteraction } from 'discord.js';
import { keyLimit } from '../../config.json';
import { SQLiteWrapper } from '../database';

export const properties: CommandProperties = {
  name: 'status',
  description: 'View the bot\'s status',
  usage: '/status',
  cooldown: 10000,
  ephemeral: true,
  noDM: false,
  ownerOnly: false,
  structure: {
    name: 'status',
    description: 'View the bot\'s status',
  },
};

export const execute: CommandExecute = async (interaction: CommandInteraction): Promise<void> => {
  const keyQueryLimit = keyLimit * interaction.client.hypixelAPI.instance.keyPercentage;
  const intervalBetweenRequests = 60 / keyQueryLimit * 1000;

  const userCount = (await SQLiteWrapper.getAllUsers({
    table: 'api',
    columns: ['discordID'],
  })).length;

  const updateInterval = userCount * intervalBetweenRequests;

  const responseEmbed = new BetterEmbed({
    color: '#7289DA',
    footer: interaction,
  })
    .setTitle('Status')
    .addFields([
      {
        name: 'Uptime',
        value: String(cleanLength(process.uptime() * 1000)),
      },
      {
        name: 'Servers',
        value: String(interaction.client.guilds.cache.size),
      },
      {
        name: 'Users',
        value: String(interaction.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)),
      },
      {
        name: 'Registered Users',
        value: String(userCount),
      },
      {
        name: 'Hypixel API',
        value: `Refresh Interval: ${cleanLength(updateInterval)}\nInstance Queries: ${interaction.client.hypixelAPI.instance.instanceUses}`,
      },
    ]);


  await interaction.editReply({
    embeds: [responseEmbed],
  });
};