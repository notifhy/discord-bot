import type { CommandProperties } from '../@types/index';
import { CommandInteraction } from 'discord.js';
import { BetterEmbed } from '../util/utility';

export const properties: CommandProperties = {
  name: 'test',
  description: 'Does stuff',
  usage: '/test',
  cooldown: 0,
  ephemeral: true,
  noDM: false,
  ownerOnly: true,
  structure: {
    name: 'test',
    description: 'does stuff',
  },
};

export const execute = async (interaction: CommandInteraction): Promise<void> => {
  throw new SyntaxError('hello hello hello hello');
  try {
    await interaction.reply({ content: 'Pong!' });
  } catch (err) {
    console.log(err);
  }
};