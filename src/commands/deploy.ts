import type { CommandProperties, SlashCommand } from '../@types/index';
import { clientID, testGuild, discordAPIkey as token } from '../../config.json';
import { CommandInteraction } from 'discord.js';
import { BetterEmbed } from '../util/utility';
import { Routes } from 'discord-api-types/v9';
import { REST } from '@discordjs/rest';
import fs from 'fs';

export const properties: CommandProperties = {
  name: 'deploy',
  description: 'Deploy commands',
  usage: '/deploy [global/local] [user/owner]',
  cooldown: 5000,
  noDM: false,
  ownerOnly: true,
  structure: {
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
          {
            name: 'None',
            value: 'none',
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
  },
};

export const execute = async (interaction: CommandInteraction): Promise<void> => {
  const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.ts'));
  const userCommands: object[] = [];
  const ownerCommands: object[] = [];

  for (const file of commandFiles) {
    // eslint-disable-next-line no-await-in-loop
    const { properties: { ownerOnly, structure } }: SlashCommand = await import(`../commands/${file}`);
    if (ownerOnly === false) userCommands.push(structure);
    else if (ownerOnly === true) ownerCommands.push(structure);
  }

  const scope = interaction.options.getString('scope');
  const type = interaction.options.getString('type');
  const guildID = interaction.options.getString('guild') ?? interaction.guildId!;
  const commands = type === 'both' ? ownerCommands.concat(userCommands) : type === 'none' ? [] : type === 'owner' ? ownerCommands : userCommands;

  const rest = new REST({ version: '9' }).setToken(token);

  if (scope === 'global') {
    await rest.put(
      Routes.applicationCommands(clientID),
      { body: commands },
    );
  } else {
    await rest.put(
      Routes.applicationGuildCommands(clientID, guildID),
      { body: commands },
    );
  }

  const successEmbed = new BetterEmbed({ color: '#7289DA', footer: interaction })
    .setTitle('Success!')
    .setDescription(JSON.stringify(commands).slice(0, 4096) ?? 'None');

  await interaction.editReply({ embeds: [successEmbed] });
};