import type { CommandProperties, Config } from '../@types/index';
import { CommandInteraction } from 'discord.js';
import { commandEmbed } from '../util/utility';
import * as fs from 'fs/promises';

export const properties: CommandProperties = {
  name: 'config',
  description: 'Configure the bot',
  usage: '/config [block/userlimit/devmode/api]',
  cooldown: 5000,
  noDM: false,
  ownerOnly: true,
  structure: {
    name: 'config',
    description: 'Toggles dynamic settings',
    options: [
      {
        name: 'block',
        description: 'Blacklists users from using this bot',
        type: '1',
        options: [{
          name: 'user',
          type: '3',
          description: 'The user\'s ID',
          required: true,
        }],
      },
      {
        name: 'userlimit',
        description: 'Sets the max amount of users',
        type: '1',
        options: [{
          name: 'limit',
          type: '4',
          description: 'The new user limit',
          required: true,
        }],
      },
      {
        name: 'devmode',
        type: '1',
        description: 'Toggla Developer Mode',
      },
      {
        name: 'api',
        type: '1',
        description: 'Toggla API commands and functions',
      },
    ],
  },
};

//JSON database moment.
export const execute = async (interaction: CommandInteraction) => {
  const responseEmbed = commandEmbed({ color: '#7289DA', interaction: interaction });
  const path = '../dynamicConfig.json';
  const file: any = await fs.readFile(path);
  const readFile: Config = JSON.parse(file);

  if (interaction.options.getSubcommand() === 'block') {
    const user = interaction.options.getString('user') as string;
    const blockedUserIndex = readFile.blockedUsers.indexOf(user);
    if (blockedUserIndex === -1) {
      readFile.blockedUsers.push(user);
      responseEmbed.setTitle(`User Added!`);
      responseEmbed.setDescription(`${user} was added to the blacklist!`);
    } else {
      readFile.blockedUsers.splice(blockedUserIndex, 1);
      responseEmbed.setTitle(`User Removed!`);
      responseEmbed.setDescription(`${user} was removed from the blacklist!`);
    }
  } else if (interaction.options.getSubcommand() === 'userlimit') {
    readFile.userLimit = interaction.options.getInteger('limit') as number;
    responseEmbed.setTitle('User Limit Updated!');
    responseEmbed.setDescription(`User Limit is now ${readFile.userLimit}!`);
  } else if (interaction.options.getSubcommand() === 'devmode') {
    readFile.devMode = !readFile.devMode;
    responseEmbed.setTitle(`Developer Mode Updated!`);
    responseEmbed.setDescription(`Developer Mode is now ${readFile.devMode === true ? 'on' : 'off'}!`);
  } else if (interaction.options.getSubcommand() === 'api') {
    readFile.api = !readFile.api;
    responseEmbed.setTitle(`API State Updated!`);
    responseEmbed.setDescription(`API commands and functions are now ${readFile.api === true ? 'on' : 'off'}!`);
  }
  await fs.writeFile(path, JSON.stringify(readFile));
  await interaction.editReply({ embeds: [responseEmbed] });
};