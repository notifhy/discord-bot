import type { CommandExecute, CommandProperties } from '../@types/client';
import { ColorResolvable, CommandInteraction, Message } from 'discord.js';
import { BetterEmbed } from '../util/utility';
import { Request } from '../hypixelAPI/Request';
import { HTTPError } from '../util/error/HTTPError';
import { Slothpixel } from '../@types/hypixel';
import { SQLiteWrapper } from '../database';

export const properties: CommandProperties = {
  name: 'channel',
  description: 'null',
  usage: '/channel [username/uuid]',
  cooldown: 15000,
  ephemeral: true,
  noDM: true,
  ownerOnly: false,
  structure: {
    name: 'channel',
    description: 'null',
  },
};

export const execute: CommandExecute = async (interaction: CommandInteraction, { userData }): Promise<void> => {
  const locales = interaction.client.regionLocales;
  await interaction.reply({ content: 'null' });
};