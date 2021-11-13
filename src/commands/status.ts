import type { CommandExecute, CommandProperties, Config } from '../@types/client';
import { CommandInteraction } from 'discord.js';
import { BetterEmbed } from '../util/utility';
import * as fs from 'fs/promises';

export const properties: CommandProperties = {
  name: 'status',
  description: 'Set a custom status',
  usage: '/status [set/clear] <string>',
  cooldown: 0,
  ephemeral: true,
  noDM: false,
  ownerOnly: true,
  structure: {
    name: 'status',
    description: 'Set a custom for the bot',
    options: [
      {
        name: 'clear',
        type: '1',
        description: 'Clear the custom status',
      },
      {
        name: 'set',
        description: 'Set a custom status',
        type: '1',
        options: [{
          name: 'string',
          type: '3',
          description: 'The status to display',
          required: false,
        }],
      },
    ],
  },
};

export const execute: CommandExecute = async (interaction: CommandInteraction): Promise<void> => {
  const responseEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null });

  if (interaction.options.getSubcommand() === 'set') {
    const status = interaction.options.getString('string') as string;
    interaction.client.user?.setActivity({ type: 'WATCHING', name: status });
    interaction.client.customStatus = true;
    responseEmbed.setTitle(`Status Set`);
    responseEmbed.setDescription(`The status is now set to ${status}!`);
  } else {
    responseEmbed.setTitle(`Status Cleared`);
    responseEmbed.setDescription(`The status is now automatic!`);
    interaction.client.customStatus = false;
  }

  await interaction.editReply({ embeds: [responseEmbed] });
};