import type { CommandExecute, CommandProperties } from '../@types/index';
import { ButtonInteraction, CommandInteraction, Message, MessageActionRow, MessageButton, MessageComponentInteraction, MessageSelectMenu, MessageSelectMenuOptions, MessageSelectOption, MessageSelectOptionData, SelectMenuInteraction } from 'discord.js';
import { BetterEmbed } from '../util/utility';
import { modules } from '../../assets.json';
import { UserData } from '../@types/database';
import { SQLiteWrapper } from '../database';
import { RegionLocales } from '../../locales/localesHandler';
import { AssetModule, AssetModules } from '../@types/modules';

export const properties: CommandProperties = {
  name: 'module',
  description: 'placeholder',
  usage: '/module',
  cooldown: 15000,
  ephemeral: true,
  noDM: false,
  ownerOnly: false,
  structure: {
    name: 'module',
    description: 'Add or remove modules for your Minecraft account',
  },
};

export const execute: CommandExecute = async (interaction: CommandInteraction, { userData: { language } }): Promise<void> => {
  const locales = interaction.client.regionLocales;
  const moduleEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .setTitle(locales.localizer('commands.modules.title', language))
    .setDescription(locales.localizer('commands.modules.description', language));

  const moduleReply = await interaction.editReply({ embeds: [moduleEmbed], components: [userModuleSelectMenu({ locales: locales })] });

  const componentFilter = (i: MessageComponentInteraction) =>
    interaction.user.id === i.user.id && i.message.id === moduleReply.id;

  const collector = (moduleReply as Message).createMessageComponentCollector({
    filter: componentFilter,
    idle: 60_000,
  });

  let selected: string;
  collector.on('collect', async (i: SelectMenuInteraction | ButtonInteraction) => {
    if (i instanceof SelectMenuInteraction) {
      selected = i.values[0];
      await selectMenuUpdate({
        moduleEmbed: moduleEmbed,
        interaction: i,
        selected: selected,
      });
    } else if (i instanceof ButtonInteraction) {
      if (i.customId !== 'modifyButton') {
        await buttonUpdate({
          moduleEmbed: moduleEmbed,
          interaction: i,
          selected: selected,
        });
      }
    }
  });

  collector.on('end', async (collected, reason) => {
    if (reason === 'idle') {
      const components = [userModuleSelectMenu({ locales: locales, disabled: true })];
      if (collected.size > 0) components.push(moduleButtons({ locales: locales, isEnabled: false, allDisabled: true }));
      await interaction.editReply({
        embeds: [moduleEmbed],
        components: components,
      });
    }
  });
};

async function selectMenuUpdate({
  moduleEmbed,
  interaction,
  selected,
}: {
  moduleEmbed: BetterEmbed,
  interaction: SelectMenuInteraction
  selected: string
}) {
  const locales = interaction.client.regionLocales;
  const userData = await new SQLiteWrapper().getUser({ discordID: interaction.user.id, table: 'users' }) as UserData;

  moduleEmbed
    .setFields(
      {
        name: `${modules[selected as keyof typeof modules].label} Module`,
        value: modules[selected as keyof typeof modules].longDescription,
      },
      {
        name: 'Status',
        value: Boolean(userData.modules?.split(' ')?.includes(selected)) ?
        'You have added this module. Click on the button to disable it. Your data will be left intact.' :
        'This module is currently disabled. Click "Enable" to enable it.',
      },
    );

  await interaction.update({
    embeds: [moduleEmbed],
    components: [
      userModuleSelectMenu({ locales: locales, selected: selected }),
      moduleButtons({ locales: locales, isEnabled: (userData.modules?.split(' ') ?? [])?.includes(selected) }),
    ],
  });
}

async function buttonUpdate({
  moduleEmbed,
  interaction,
  selected,
}: {
  moduleEmbed: BetterEmbed,
  interaction: ButtonInteraction
  selected: string
}) {
  const locales = interaction.client.regionLocales;
  let userData: UserData = await new SQLiteWrapper().getUser({
    discordID: interaction.user.id,
    table: 'users',
  }) as UserData;

  const userModules = userData.modules?.split(' ') ?? []; //Extra logic to allow for concurrent instances of this command
  const selectedModuleIndex = userModules.indexOf(selected);
  if (interaction.customId === 'disableButton' && selectedModuleIndex !== -1) userModules.splice(selectedModuleIndex, 1);
  else if (interaction.customId === 'enableButton' && selectedModuleIndex === -1) userModules.push(selected);

  userData = await new SQLiteWrapper().updateUser({
    discordID: interaction.user.id,
    table: 'users',
    data: {
      modules: userModules.join(' '),
    },
  }) as UserData;

  moduleEmbed
    .setFields(
      {
        name: `${modules[selected as keyof typeof modules].label} Module`,
        value: (locales.get('s', userData.language) as AssetModule).longDescription,
      },
      {
        name: 'Status',
        value: Boolean((userData.modules?.split(' ') ?? []).includes(selected)) ?
        'You have added this module. Click on the button to disable it. Your data will be left intact.' :
        'This module is currently disabled. Click "Enable" to enable it.',
      },
    );

  await interaction.update({
    embeds: [moduleEmbed],
    components: [
      userModuleSelectMenu({ locales: locales, selected: selected }),
      moduleButtons({ locales: locales, isEnabled: (userData.modules?.split(' ') ?? [])?.includes(selected) }),
    ],
  });
}

function userModuleSelectMenu({
  locales,
  selected,
  disabled,
}: {
  locales: RegionLocales,
  selected?: string,
  disabled?: boolean,
}): MessageActionRow {
  const selectMenuOptions: MessageSelectOptionData[] = [];
  for (const module in modules) {
    if (Object.prototype.hasOwnProperty.call(modules, module)) {
      const { label, description, value } = modules[module as keyof typeof modules];
      selectMenuOptions.push({
        label: label,
        description: description,
        value: value,
        default: Boolean(value === selected), //Sets the default so their selection stays when initially selected
      });
    }
  }

  return new MessageActionRow()
    .addComponents(
      new MessageSelectMenu()
        .setCustomId('modules')
        .setPlaceholder('Select a module')
        .addOptions(selectMenuOptions)
        .setDisabled(disabled ?? false),
    );
};

function moduleButtons({
  locales,
  isEnabled, //If the module in question is enabled
  allDisabled,
}: {
  locales: RegionLocales,
  isEnabled: boolean
  allDisabled?: boolean,
}): MessageActionRow {
  return new MessageActionRow()
    .setComponents([
      new MessageButton()
        .setCustomId('enableButton')
        .setLabel('Enable')
        .setStyle('SUCCESS')
        .setDisabled(allDisabled ?? isEnabled),
      new MessageButton()
        .setCustomId('disableButton')
        .setLabel('Disable')
        .setStyle('DANGER')
        .setDisabled(allDisabled ?? isEnabled === false),
      new MessageButton()
        .setCustomId('modifyButton')
        .setLabel('Settings')
        .setStyle('PRIMARY')
        .setDisabled(allDisabled ?? isEnabled === false),
    ]);
}