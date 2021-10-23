import { CommandInteraction } from 'discord.js';
import { commandEmbed } from '../utility';
import type { SlashCommand } from '../@types';
import * as fs from 'fs';

export const name = 'reload';
export const cooldown = null;
export const noDM = false;
export const ownerOnly = true;

export const execute = async (interaction: CommandInteraction) => {
  if (interaction.options.getSubcommand() === 'all') {
    const commandsFolder = fs.readdirSync('./commands').filter(file => file.endsWith('.ts'));
    const now = Date.now();

    for (const file of commandsFolder) {
      delete require.cache[require.resolve(`./${file}`)];
      // eslint-disable-next-line no-await-in-loop
      const newCommand: SlashCommand = require(`./${file}`);
      interaction.client.commands.set(newCommand.name, newCommand);
    }

    const reloadedEmbed = commandEmbed('#7289DA', 'Slash Command', `/${interaction.commandName}`)
      .setTitle(`Reloaded All Commands!`)
      .setDescription(`All commands have been reloaded! This action took ${Date.now() - now} milliseconds.`);

    await interaction.editReply({ embeds: [reloadedEmbed] });
  } else {
    const input = interaction.options.getString('command') as string;
    const command = interaction.client.commands.get(input) as SlashCommand;

    if (!command) {
      const noCMDReloadEmbed = commandEmbed('#FF5555', 'Slash Command', `/${interaction.commandName}`)
        .setColor(`#FF5555`)
        .setTitle(`Unknown Command!`)
        .setDescription(`There is no command with the name \`${input}\`!`);

      await interaction.editReply({ embeds: [noCMDReloadEmbed] });
      return;
    }

    //Import doesn't have a way to clear the cache..
    delete require.cache[require.resolve(`./${command.name}.ts`)];

    const newCommand: SlashCommand = require(`./${command.name}.ts`);
    interaction.client.commands.set(newCommand.name, newCommand);

    const reloadedEmbed = commandEmbed('#7289DA', 'Slash Command', `/${interaction.commandName}`)
      .setTitle(`/${input} Reloaded!`)
      .setDescription(`/${input} was successfully reloaded!`);

    await interaction.editReply({ embeds: [reloadedEmbed] });
  }
};

export const structure = {
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
      description: 'THe command to refresh',
      required: true,
    }],
  }],
};