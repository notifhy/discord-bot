import type { SlashCommand } from '../@types/index';
import { clientID, testGuild, discordAPIkey as token } from '../../config.json';
import { CommandInteraction } from 'discord.js';
import { commandEmbed } from '../util/utility';
import { Routes } from 'discord-api-types/v9';
import { REST } from '@discordjs/rest';
import fs from 'fs';

export const name = 'deploy';
export const description = 'Deploy commands';
export const usage = '/deploy [global/local] [user/owner]';
export const cooldown = 5000;
export const noDM = false;
export const ownerOnly = true;

export const execute = async (interaction: CommandInteraction) => {
  const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.ts'));
  const userCommands: object[] = [];
  const ownerCommands: object[] = [];

  for (const file of commandFiles) {
    // eslint-disable-next-line no-await-in-loop
    const command: SlashCommand = await import(`../commands/${file}`);
    if (command.ownerOnly === false) userCommands.push(command.structure);
    else if (command.ownerOnly === true) ownerCommands.push(command.structure);
  }

  const scope = interaction.options.getString('scope');
  const type = interaction.options.getString('type');
  const guildID = interaction.options.getString('guild');
  const commands = type === 'both' ? ownerCommands.concat(userCommands) : type === 'owner' ? ownerCommands : userCommands;

  if (scope === 'guild' && guildID === null) throw new Error('No Guild ID specified');

  const rest = new REST({ version: '9' }).setToken(token);

  if (scope === 'global') {
    await rest.put(
      Routes.applicationCommands(clientID),
      { body: commands },
    );
  } else {
    await rest.put(
      Routes.applicationGuildCommands(clientID, testGuild),
      { body: commands },
    );
  }

  const successEmbed = commandEmbed({ color: '#7289DA', interaction: interaction })
    .setTitle('Success!')
    .setDescription(JSON.stringify(commands).slice(0, 4096) ?? 'None');

  await interaction.editReply({ embeds: [successEmbed] });
};

export const structure = {
  name: 'deploy',
  description: 'Displays helpful information and available commands',
  options: [
    {
      name: 'scope',
      description: 'Global or Guild',
      type: 3,
      required: true,
      choices: [
        {
          name: 'Global',
          value: 'global',
        },
        {
          name: 'Guild',
          value: 'guild',
        },
      ],
    },
    {
      name: 'type',
      description: 'User or Owner commands',
      type: 3,
      required: true,
      choices: [
        {
          name: 'User',
          value: 'user',
        },
        {
          name: 'Owner',
          value: 'owner',
        },
        {
          name: 'Both',
          value: 'both',
        },
      ],
    },
    {
      name: 'guild',
      description: 'Guild ID',
      type: 3,
      required: false,
    },
  ],
};