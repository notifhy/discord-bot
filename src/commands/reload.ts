import type { CommandExecute, CommandProperties, SlashCommand } from '../@types/client';
import { CommandInteraction } from 'discord.js';
import { BetterEmbed } from '../util/utility';
import * as fs from 'fs';

export const properties: CommandProperties = {
  name: 'reload',
  description: 'Reloads all or a command',
  usage: '/config [all/single] <command>',
  cooldown: 0,
  ephemeral: true,
  noDM: false,
  ownerOnly: true,
  structure: {
    name: 'reload',
    description: 'Reload',
    options: [{
      name: 'all',
      type: 1,
      description: 'Refresh all commands',
    },
    {
      name: 'single',
      type: 1,
      description: 'Refresh a single command',
      options: [{
        name: 'command',
        type: 3,
        description: 'The command to refresh',
        required: true,
      }],
    }],
  },
};

export const execute: CommandExecute = async (interaction: CommandInteraction): Promise<void> => {
  if (interaction.options.getSubcommand() === 'all') await reloadAllCommands(interaction);
  else await reloadCommand(interaction);
};

async function reloadAllCommands(interaction: CommandInteraction): Promise<void> {
  const commandsFolder = fs.readdirSync('./commands').filter(file => file.endsWith('.ts'));
  const now = Date.now();

  for (const file of commandsFolder) {
    //Import doesn't have a way to clear the cache
    delete require.cache[require.resolve(`./${file}`)];
    // eslint-disable-next-line no-await-in-loop
    const newCommand: SlashCommand = require(`./${file}`);
    interaction.client.commands.set(newCommand.properties.name, newCommand);
  }

  const reloadedEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .setTitle(`Reloaded All Commands!`)
    .setDescription(`All commands have been reloaded! This action took ${Date.now() - now} milliseconds.`);

  await interaction.editReply({ embeds: [reloadedEmbed] });
}

async function reloadCommand(interaction: CommandInteraction): Promise<void> {
  const input = interaction.options.getString('command') as string;
  const command: SlashCommand | undefined = interaction.client.commands.get(input);

  if (command === undefined) {
    const noCMDReloadEmbed = new BetterEmbed({ color: '#FF5555', interaction: interaction, footer: null })
      .setColor(`#FF5555`)
      .setTitle(`Unknown Command!`)
      .setDescription(`There is no command with the name \`${input}\`!`);

    await interaction.editReply({ embeds: [noCMDReloadEmbed] });
    return;
  }

  //Import doesn't have a way to clear the cache
  delete require.cache[require.resolve(`./${command.properties.name}.ts`)];

  const newCommand: SlashCommand = require(`./${command.properties.name}.ts`);
  interaction.client.commands.set(newCommand.properties.name, newCommand);

  const reloadedEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .setTitle(`/${input} Reloaded!`)
    .setDescription(`/${input} was successfully reloaded!`);

  await interaction.editReply({ embeds: [reloadedEmbed] });
}