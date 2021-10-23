import { CommandInteraction } from 'discord.js';
import { commandEmbed, isInstanceOfError } from '../utility';
import * as fs from 'fs/promises';

export const name = 'config';
export const cooldown = 5000;
export const noDM = false;
export const ownerOnly = true;

export const execute = async (interaction: CommandInteraction) => {
  const readFile: any = await fs.readFile('../../ownerSettings.json');

  if (interaction.options.getSubcommandGroup() === 'strings') {
    if (interaction.options.getSubcommand() === 'block') {
      const user = interaction.options.getString('string');
      if (readFile.blockedUsers.includes(user)) {
        readFile.blockedUsers.push(user);
      } else {
        const blockedUserIndex = readFile.blockedUsers.indexOf(user);
        readFile.blockedUsers.splice(blockedUserIndex, 1);
      }
    } else if (interaction.options.getSubcommand() === 'userlimit') {
      readFile.userlimit = interaction.options.getInteger('limit');
    }
  } else {
    const toggle = interaction.options.getString('booleans') as string;
    readFile[toggle] = !readFile[toggle];
  }
};

export const structure = {
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
      name: 'booleans',
      type: '3',
      description: 'The setting to toggle',
      choices: [
        {
          name: 'Developer Mode',
          value: 'devMode',
        },
        {
          name: 'API Toggle',
          value: 'api',
        },
      ],
    },
  ],
};