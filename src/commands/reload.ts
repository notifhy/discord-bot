import type { ClientEvent, CommandExecute, CommandProperties, ClientCommand } from '../@types/client';
import type { ClientModule } from '../@types/modules';
import { BetterEmbed } from '../util/utility';
import { CommandInteraction } from 'discord.js';
import Constants from '../util/constants';

export const properties: CommandProperties = {
  name: 'reload',
  description: 'Reloads all or a command',
  usage: '/reload [all/single] <command>',
  cooldown: 0,
  ephemeral: true,
  noDM: false,
  ownerOnly: true,
  structure: {
    name: 'reload',
    description: 'Reload',
    options: [
      {
        name: 'all',
        type: 1,
        description: 'Refreshes everything',
      },
      {
        name: 'single',
        type: 1,
        description: 'Refresh a single command',
        options: [
          {
            name: 'type',
            type: 3,
            description: 'The category to refresh',
            required: true,
            choices: [
              {
                name: 'commands',
                value: 'commands',
              },
              {
                name: 'events',
                value: 'events',
              },
              {
                name: 'modules',
                value: 'modules',
              },
            ],
          },
          {
            name: 'item',
            type: 3,
            description: 'The item to refresh',
            required: true,
          },
        ],
      },
    ],
  },
};

export const execute: CommandExecute = async (interaction: CommandInteraction): Promise<void> => {
  const now = Date.now();
  switch (interaction.options.getSubcommand()) {
    case 'all': {
      interaction.client.commands.forEach((_value, key) => commandRefresh(interaction, key));
      interaction.client.events.forEach((_value, key) => eventRefresh(interaction, key));
      interaction.client.modules.forEach((_value, key) => moduleRefresh(interaction, key));

      const reloadedEmbed = new BetterEmbed({ color: '#7289DA', footer: interaction })
        .setTitle(`Reloaded Everything`)
        .setDescription(`All imports have been reloaded! This action took ${Date.now() - now} milliseconds.`);

      await interaction.editReply({ embeds: [reloadedEmbed] });
      break;
    }
    case 'single': {
      const typeName = interaction.options.getString('type');
      const type = interaction.client[typeName as keyof Pick<typeof interaction.client, 'commands' | 'events' | 'modules'>];
      const item = interaction.options.getString('item')!;
      const selected = type.get(item);

      if (selected === undefined) {
        const undefinedSelected = new BetterEmbed({ color: Constants.color.warning, footer: interaction })
          .setTitle(`Unknown Item`)
          .setDescription(`There is no item with the structure ${typeName}.${item}!`);

        await interaction.editReply({ embeds: [undefinedSelected] });
        return;
      }

      if (typeName === 'commands') {
        commandRefresh(interaction, selected.properties.name);
      } else if (typeName === 'events') {
        eventRefresh(interaction, selected.properties.name);
      } else if (typeName === 'modules') {
        moduleRefresh(interaction, selected.properties.name);
      }

      const reloadedEmbed = new BetterEmbed({ color: '#7289DA', footer: interaction })
        .setTitle(`Reloaded`)
        .setDescription(`${typeName}.${item} was successfully reloaded! This action took ${Date.now() - now} milliseconds.`);

      await interaction.editReply({ embeds: [reloadedEmbed] });
      break;
    }

    //no default
  }
};

function commandRefresh(interaction: CommandInteraction, item: string) {
  delete require.cache[require.resolve(`./${item}.ts`)];
  const refreshed: ClientCommand = require(`./${item}.ts`); //eslint-disable-line @typescript-eslint/no-var-requires
  interaction.client.commands.set(refreshed.properties.name, refreshed);
}

function eventRefresh(interaction: CommandInteraction, item: string) {
  delete require.cache[require.resolve(`../events/${item}.ts`)];
  const refreshed: ClientEvent = require(`../events/${item}.ts`); //eslint-disable-line @typescript-eslint/no-var-requires
  interaction.client.events.set(refreshed.properties.name, refreshed);
}

function moduleRefresh(interaction: CommandInteraction, item: string) {
  delete require.cache[require.resolve(`../modules/${item}.ts`)];
  const refreshed: ClientModule = require(`../modules/${item}.ts`); //eslint-disable-line @typescript-eslint/no-var-requires
  interaction.client.modules.set(refreshed.properties.name, refreshed);
}
