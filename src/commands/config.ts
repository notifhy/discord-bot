import type { CommandExecute, CommandProperties, Config } from '../@types/client';
import { CommandInteraction } from 'discord.js';
import { BetterEmbed } from '../util/utility';
import * as fs from 'fs/promises';
import { SQLiteWrapper } from '../database';
import { RawConfig } from '../@types/database';

export const properties: CommandProperties = {
  name: 'config',
  description: 'Configure the bot',
  usage: '/config [block/userlimit/devmode/api]',
  cooldown: 0,
  ephemeral: true,
  noDM: false,
  ownerOnly: true,
  structure: {
    name: 'config',
    description: 'Toggles dynamic settings',
    options: [
      {
        name: 'api',
        type: '1',
        description: 'Toggle API commands and functions',
      },
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
        name: 'devmode',
        type: '1',
        description: 'Toggle Developer Mode',
      },
    ],
  },
};

export const execute: CommandExecute = async (interaction: CommandInteraction): Promise<void> => {
  const responseEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null });
  const config = await SQLiteWrapper.queryGet({
    query: 'SELECT blockedUsers, devMode, enabled FROM config WHERE rowid = 1',
    allowUndefined: false,
  }) as RawConfig;

  if (interaction.options.getSubcommand() === 'api') { //Persists across restarts
    config.enabled = Number(!Boolean(config.enabled));
    interaction.client.config.enabled = Boolean(config.enabled);
    responseEmbed.setTitle(`API State Updated!`);
    responseEmbed.setDescription(`API commands and functions are now ${Boolean(config.enabled) === true ? 'on' : 'off'}!`);
  } else if (interaction.options.getSubcommand() === 'block') {
    const user = interaction.options.getString('user') as string;
    const blockedUsers = JSON.parse(config.blockedUsers) as string[];
    const blockedUserIndex = blockedUsers.indexOf(user);
    if (blockedUserIndex === -1) {
      blockedUsers.push(user);
      responseEmbed.setTitle(`User Added`);
      responseEmbed.setDescription(`${user} was added to the blacklist!`);
    } else {
      blockedUsers.splice(blockedUserIndex, 1);
      responseEmbed.setTitle(`User Removed`);
      responseEmbed.setDescription(`${user} was removed from the blacklist!`);
    }
    config.blockedUsers = JSON.stringify(blockedUsers);
    interaction.client.config.blockedUsers = blockedUsers;
  } else if (interaction.options.getSubcommand() === 'devmode') {
    config.devMode = Number(!Boolean(config.devMode));
    interaction.client.config.devMode = Boolean(config.devMode);
    responseEmbed.setTitle(`Developer Mode Updated`);
    responseEmbed.setDescription(`Developer Mode is now ${Boolean(config.devMode) === true ? 'on' : 'off'}!`);
  }

  await SQLiteWrapper.queryRun({
    query: 'UPDATE config set blockedUsers = ?, devMode = ?, enabled = ? WHERE rowid = 1',
    data: [
      config.blockedUsers,
      config.devMode,
      config.enabled,
    ],
  });
  await interaction.editReply({ embeds: [responseEmbed] });
};