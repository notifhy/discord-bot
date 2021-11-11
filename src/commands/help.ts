import type { CommandExecute, CommandProperties, SlashCommand } from '../@types/client';
import { CommandInteraction } from 'discord.js';
import { BetterEmbed } from '../util/utility';
import { UserData } from '../@types/database';

export const properties: CommandProperties = {
  name: 'help',
  description: 'Displays helpful information and available commands',
  usage: '/help [commands/information] <command>',
  cooldown: 5000,
  ephemeral: true,
  noDM: false,
  ownerOnly: false,
  structure: {
    name: 'help',
    description: 'Displays helpful information and available commands',
    options: [
      {
        name: 'commands',
        type: '1',
        description: 'Displays information about commands',
        options: [{
          name: 'command',
          type: '3',
          description: 'A command to get info about. This parameter is completely optional',
          required: false,
        }],
      },
      {
        name: 'information',
        description: 'Returns information about this bot ',
        type: '1',
      },
    ],
  },
};

export const execute: CommandExecute = async (interaction: CommandInteraction, { userData }): Promise<void> => {
  if (interaction.options.getSubcommand() === 'information') await information(interaction, userData);
  else if (interaction.options.getString('command')) await specific(interaction, userData);
	else await commands(interaction, userData);
};

async function information(interaction: CommandInteraction, userData: UserData) {
  const locales = interaction.client.regionLocales;
  const informationEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .setTitle(locales.localizer('commands.help.information.title', userData.language))
    .setDescription(locales.localizer('commands.help.information.description', userData.language));

  await interaction.editReply({ embeds: [informationEmbed] });
}

async function specific(interaction: CommandInteraction, userData: UserData) {
  const locales = interaction.client.regionLocales;
  const commandArg: string = interaction.options.getString('command') as string;
  const command: SlashCommand | undefined = interaction.client.commands.get(commandArg);
  const commandSearchEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null });

  if (command === undefined) {
    commandSearchEmbed
      .setColor('#ff5555')
      .setTitle(locales.localizer('commands.help.specific.invalid.title', userData.language))
      .setDescription(locales.localizer('commands.help.specific.invalid.description', userData.language, {
        command: commandArg,
      }));
    await interaction.editReply({ embeds: [commandSearchEmbed] });
    return;
  }

  commandSearchEmbed.setTitle(locales.localizer('commands.help.specific.title', userData.language, {
    command: commandArg,
  }));

  if (command.properties.description) {
    commandSearchEmbed.setDescription(locales.localizer('commands.help.specific.description', userData.language, {
      commandDescription: command.properties.description,
    }));
  }

  console.log(locales.localizer('commands.help.specific.usage.name', userData.language));
  console.log(JSON.stringify(locales.localizer('commands.help.specific.usage', userData.language)));
  console.log(JSON.stringify(locales.localizer('commands.help.specific', userData.language)));

  commandSearchEmbed.addField(locales.localizer('commands.help.specific.usage.name', userData.language),
    locales.localizer('commands.help.specific.usage.value', userData.language, {
      commandUsage: command.properties.usage,
  }));

  commandSearchEmbed.addField(locales.localizer('commands.help.specific.cooldown.name', userData.language),
    locales.localizer('commands.help.specific.cooldown.value', userData.language, {
      commandCooldown: command.properties.cooldown / 1000,
  }));

  if (command.properties.noDM === true) {
    commandSearchEmbed.addField(locales.localizer('commands.help.specific.dm.name', userData.language),
    locales.localizer('commands.help.specific.dm.value', userData.language, {
      commandCooldown: command.properties.cooldown,
    }));
  }

  if (command.properties.ownerOnly === true) {
    commandSearchEmbed.addField(locales.localizer('commands.help.specific.owner.name', userData.language),
    locales.localizer('commands.help.specific.owner.value', userData.language, {
      commandCooldown: command.properties.cooldown,
    }));
  }

  await interaction.editReply({ embeds: [commandSearchEmbed] });
}

async function commands(interaction: CommandInteraction, userData: UserData) {
  const locales = interaction.client.regionLocales;
  const commandsCollection = interaction.client.commands.filter(command => command.properties.ownerOnly === false);
  const allCommandsEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .setTitle(locales.localizer('commands.help.all.title', userData.language))
    .setDescription(locales.localizer('commands.help.all.description', userData.language));

  for (const command of commandsCollection.values()) {
    allCommandsEmbed.addField(locales.localizer('commands.help.all.field.name', userData.language, {
      commandUsage: `/${command.properties.name}`,
    }),
    locales.localizer('commands.help.all.field.value', userData.language, {
      commandDescription: command.properties.description,
    }));
  }

  await interaction.editReply({ embeds: [allCommandsEmbed] });
}