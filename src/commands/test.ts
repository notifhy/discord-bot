import type { CommandExecute, CommandProperties } from '../@types/client';
import { CommandInteraction } from 'discord.js';

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
    options: [
      {
        name: 'delete',
        type: '2',
        description: 'Delete all of your data',
        options: [
          {
            name: 'view',
            description: 'Returns a file with all of your data',
            type: '1',
            options: [{
              name: 'command',
              type: '3',
              description: 'A command to get info about. This parameter is completely optional',
              required: false,
            }],
          },
        ],
      },
    ],
  },
};

export const execute: CommandExecute = async (interaction: CommandInteraction): Promise<void> => {
  throw new SyntaxError('hello hello hello hello');
  try {
    await interaction.reply({ content: 'Pong!' });
  } catch (err) {
    console.log(err);
  }
};