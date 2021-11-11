import type { CommandExecute, CommandProperties } from '../@types/client';
import { ButtonInteraction, CommandInteraction, Message, MessageActionRow, MessageActionRowComponentResolvable, MessageButton, MessageButtonStyleResolvable, MessageComponentInteraction, MessageSelectMenu, MessageSelectOptionData, SelectMenuInteraction } from 'discord.js';
import { BetterEmbed } from '../util/utility';
import type { UserAPIData } from '../@types/database';
import { SQLiteWrapper } from '../database';
import { AssetModules } from '../@types/modules';
import { Locale, ModuleButtons } from '../@types/locales';

export const properties: CommandProperties = {
  name: 'modules',
  description: 'placeholder',
  usage: '/modules',
  cooldown: 15000,
  ephemeral: true,
  noDM: false,
  ownerOnly: false,
  structure: {
    name: 'modules',
    description: 'Add or remove modules for your Minecraft account',
  },
};

export const execute: CommandExecute = async (interaction: CommandInteraction, { userData }): Promise<void> => {
  const locale = interaction.client.regionLocales.locale(userData.language).commands.modules;
  const moduleEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .setTitle(locale.title)
    .setDescription(locale.description);

  const moduleReply = await interaction.editReply({
    embeds: [moduleEmbed],
    components: [userModuleSelectMenu({ locale: locale })],
  });

  await interaction.client.channels.fetch(interaction.channelId); //Loads channel into cache to use for the component collector
  //The chance of failure is low enough to accept

  const componentFilter = (i: MessageComponentInteraction) =>
    interaction.user.id === i.user.id && i.message.id === moduleReply.id;

  const collector = interaction!.channel!.createMessageComponentCollector({
    filter: componentFilter,
    idle: 150_000,
  });

  let selected: string;
  collector.on('collect', async (i: SelectMenuInteraction | ButtonInteraction) => {
    if (i instanceof SelectMenuInteraction) {
      selected = i.values[0];
      await selectMenuUpdate({
        interaction: i,
        locale: locale,
        moduleEmbed: moduleEmbed,
        selected: selected,
      });
    } else if (i instanceof ButtonInteraction) {
      if (i.customId !== 'modifyButton') {
        await buttonUpdate({
          locale: locale,
          interaction: i,
          moduleEmbed: moduleEmbed,
          selected: selected,
        });
      }
    }
  });

  collector.on('end', async (collected, reason) => {
    if (reason === 'idle') {
      const components = [userModuleSelectMenu({ locale: locale, disabled: true })];
      if (collected.size > 0) components.push(moduleButtons({ locale: locale, isEnabled: false, allDisabled: true }));
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
  locale,
  selected,
}: {
  moduleEmbed: BetterEmbed,
  interaction: SelectMenuInteraction
  locale: Locale['commands']['modules'],
  selected: string
}) {
  const userAPIData: UserAPIData = await SQLiteWrapper.getUser({
    discordID: interaction.user.id,
    table: 'api',
    columns: ['modules'],
  }) as UserAPIData;

  const modules = locale.modules as AssetModules;
  moduleEmbed
    .setFields(
      {
        name: `${modules[selected as keyof typeof modules].label} Module`,
        value: modules[selected as keyof typeof modules].longDescription,
      },
      {
        name: 'Status',
        value: Boolean(userAPIData.modules.includes(selected)) ?
          locale.statusField.added :
          locale.statusField.removed,
      },
    );

  await interaction.update({
    embeds: [moduleEmbed],
    components: [
      userModuleSelectMenu({ locale: locale, selected: selected }),
      moduleButtons({ locale: locale, isEnabled: userAPIData.modules.includes(selected) }),
    ],
  });
}

async function buttonUpdate({
  interaction,
  locale,
  moduleEmbed,
  selected,
}: {
  interaction: ButtonInteraction
  locale: Locale['commands']['modules'],
  moduleEmbed: BetterEmbed,
  selected: string
}) {
  let userAPIData: UserAPIData = await SQLiteWrapper.getUser({
    discordID: interaction.user.id,
    table: 'api',
    columns: ['modules'],
  }) as UserAPIData;

  const userModules = userAPIData.modules; //Extra logic to allow for concurrent instances of this command
  const selectedModuleIndex = userModules.indexOf(selected);
  if (interaction.customId === 'disableButton' && selectedModuleIndex !== -1) userModules.splice(selectedModuleIndex, 1);
  else if (interaction.customId === 'enableButton' && selectedModuleIndex === -1) userModules.push(selected);

  userAPIData = await SQLiteWrapper.updateUser({
    discordID: interaction.user.id,
    table: 'api',
    data: {
      modules: userModules,
    },
  }) as UserAPIData;

  const modules = locale.modules as AssetModules;
  moduleEmbed
    .setFields(
      {
        name: `${modules[selected as keyof typeof modules].label} Module`,
        value: modules[selected as keyof typeof modules].longDescription,
      },
      {
        name: locale.statusField.name,
        value: Boolean(userAPIData.modules.includes(selected)) ?
          locale.statusField.added :
          locale.statusField.removed,
      },
    );

  await interaction.update({
    embeds: [moduleEmbed],
    components: [
      userModuleSelectMenu({ locale: locale, selected: selected }),
      moduleButtons({ locale: locale, isEnabled: userAPIData.modules.includes(selected) }),
    ],
  });
}

function userModuleSelectMenu({
  disabled,
  locale,
  selected,
}: {
  disabled?: boolean,
  locale: Locale['commands']['modules'],
  selected?: string,
}): MessageActionRow {
  const selectMenuOptions: MessageSelectOptionData[] = [];
  const modules = locale.modules as AssetModules;
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
        .setPlaceholder(locale.menuPlaceholder)
        .addOptions(selectMenuOptions)
        .setDisabled(disabled ?? false),
    );
};

function moduleButtons({
  allDisabled,
  isEnabled, //If the module in question is enabled
  locale,
}: {
  allDisabled?: boolean,
  isEnabled: boolean
  locale: Locale['commands']['modules'],
}): MessageActionRow {
  const buttons: MessageActionRowComponentResolvable[] = [];
  const components = locale.buttons as ModuleButtons;
  for (const component in components) {
    if (Object.prototype.hasOwnProperty.call(components, component)) {
      const button = new MessageButton()
        .setLabel(components[component].label)
        .setCustomId(components[component].id)
        .setStyle(components[component].style as MessageButtonStyleResolvable)
        .setDisabled(components[component].invert === true ?
          allDisabled ?? isEnabled === false :
          allDisabled ?? isEnabled,
        );
        buttons.push(button);
    }
  }

  return new MessageActionRow().setComponents(buttons);
}