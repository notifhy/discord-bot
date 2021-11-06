import type { CommandProperties, SlashCommand } from '../@types/index';
import { CommandInteraction } from 'discord.js';
import { BetterEmbed } from '../util/utility';

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

export const execute = async (interaction: CommandInteraction): Promise<void> => {
  if (interaction.options.getSubcommand() === 'information') information(interaction);
  else if (interaction.options.getString('command')) await specific(interaction);
	else await commands(interaction);
};

async function information(interaction: CommandInteraction) {
  const locales = interaction.client.regionLocales;
  const informationEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .setTitle(locales.localizer('commands.help.information.title', undefined))
    .setDescription(locales.localizer('commands.help.information.description', undefined));

  await interaction.editReply({ embeds: [informationEmbed] });
}

async function specific(interaction: CommandInteraction) {
  const locales = interaction.client.regionLocales;
  const commandArg: string = interaction.options.getString('command') as string;
  const command: SlashCommand | undefined = interaction.client.commands.get(commandArg);
  const commandSearchEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null });

  if (command === undefined) {
    commandSearchEmbed
      .setColor('#ff5555')
      .setTitle(locales.localizer('commands.help.specific.invalid.title', undefined))
      .setDescription(locales.localizer('commands.help.specific.invalid.description', undefined, {
        command: commandArg,
      }));
    await interaction.editReply({ embeds: [commandSearchEmbed] });
    return;
  }

  commandSearchEmbed.setTitle(locales.localizer('commands.help.specific.title', undefined, {
    command: commandArg,
  }));

  if (command.properties.description) {
    commandSearchEmbed.setDescription(locales.localizer('commands.help.specific.description', undefined, {
      commandDescription: command.properties.description,
    }));
  }

  console.log(locales.localizer('commands.help.specific.usage.name', undefined));
  console.log(JSON.stringify(locales.localizer('commands.help.specific.usage', undefined)));
  console.log(JSON.stringify(locales.localizer('commands.help.specific', undefined)));

  commandSearchEmbed.addField(locales.localizer('commands.help.specific.usage.name', undefined),
    locales.localizer('commands.help.specific.usage.value', undefined, {
      commandUsage: command.properties.usage,
  }));

  commandSearchEmbed.addField(locales.localizer('commands.help.specific.cooldown.name', undefined),
    locales.localizer('commands.help.specific.cooldown.value', undefined, {
      commandCooldown: command.properties.cooldown / 1000,
  }));

  if (command.properties.noDM === true) {
    commandSearchEmbed.addField(locales.localizer('commands.help.specific.dm.name', undefined),
    locales.localizer('commands.help.specific.dm.value', undefined, {
      commandCooldown: command.properties.cooldown,
    }));
  }

  if (command.properties.ownerOnly === true) {
    commandSearchEmbed.addField(locales.localizer('commands.help.specific.owner.name', undefined),
    locales.localizer('commands.help.specific.owner.value', undefined, {
      commandCooldown: command.properties.cooldown,
    }));
  }

  await interaction.editReply({ embeds: [commandSearchEmbed] });
}

async function commands(interaction: CommandInteraction) {
  const locales = interaction.client.regionLocales;
  const commandsCollection = interaction.client.commands.filter(command => command.properties.ownerOnly === false);
  const allCommandsEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .setTitle(locales.localizer('commands.help.all.title', undefined))
    .setDescription(locales.localizer('commands.help.all.description', undefined));

  for (const command of commandsCollection.values()) {
    allCommandsEmbed.addField(locales.localizer('commands.help.all.field.name', undefined, {
      commandUsage: `/${command.properties.name}`,
    }),
    locales.localizer('commands.help.all.field.value', undefined, {
      commandDescription: command.properties.description,
    }));
  }

  await interaction.editReply({ embeds: [allCommandsEmbed] });
}