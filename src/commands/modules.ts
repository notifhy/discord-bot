import type { CommandExecute, CommandProperties } from '../@types/client';
import { ButtonInteraction, CommandInteraction, Message, MessageActionRow, MessageActionRowComponentResolvable, MessageButton, MessageButtonStyleResolvable, MessageComponentInteraction, MessageSelectMenu, MessageSelectOptionData, SelectMenuInteraction } from 'discord.js';
import { BetterEmbed } from '../util/utility';
import { UserAPIData, UserData } from '../@types/database';
import { SQLiteWrapper } from '../database';
import { RegionLocales } from '../../locales/localesHandler';
import { AssetModules } from '../@types/modules';
import { ModuleButtons } from '../@types/locales';

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
  const locales = interaction.client.regionLocales;
  const moduleEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .setTitle(locales.localizer('commands.modules.title', userData.language))
    .setDescription(locales.localizer('commands.modules.description', userData.language));

  const moduleReply = await interaction.editReply({
    embeds: [moduleEmbed],
    components: [userModuleSelectMenu({ locales: locales, userData: userData })],
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
        moduleEmbed: moduleEmbed,
        interaction: i,
        userData: userData,
        selected: selected,
      });
    } else if (i instanceof ButtonInteraction) {
      if (i.customId !== 'modifyButton') {
        await buttonUpdate({
          moduleEmbed: moduleEmbed,
          interaction: i,
          userData: userData,
          selected: selected,
        });
      }
    }
  });

  collector.on('end', async (collected, reason) => {
    if (reason === 'idle') {
      const components = [userModuleSelectMenu({ locales: locales, userData: userData, disabled: true })];
      if (collected.size > 0) components.push(moduleButtons({ locales: locales, userData: userData, isEnabled: false, allDisabled: true }));
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
  userData,
  selected,
}: {
  moduleEmbed: BetterEmbed,
  interaction: SelectMenuInteraction
  userData: UserData,
  selected: string
}) {
  const locales = interaction.client.regionLocales;
  const userAPIData: UserAPIData = await SQLiteWrapper.getUser({
    discordID: interaction.user.id,
    table: 'users',
    columns: ['language'],
  }) as UserAPIData;

  const modules = locales.get('commands.modules.modules', userData.language) as unknown as AssetModules;
  moduleEmbed
    .setFields(
      {
        name: `${modules[selected as keyof typeof modules].label} Module`,
        value: modules[selected as keyof typeof modules].longDescription,
      },
      {
        name: 'Status',
        value: Boolean(userAPIData.modules?.split(' ')?.includes(selected)) ?
          locales.localizer('commands.modules.statusField.added', userData.language) :
          locales.localizer('commands.modules.statusField.removed', userData.language),
      },
    );

  await interaction.update({
    embeds: [moduleEmbed],
    components: [
      userModuleSelectMenu({ locales: locales, userData: userData, selected: selected }),
      moduleButtons({ locales: locales, userData: userData, isEnabled: (userAPIData.modules?.split(' ') ?? [])?.includes(selected) }),
    ],
  });
}

async function buttonUpdate({
  moduleEmbed,
  interaction,
  userData,
  selected,
}: {
  moduleEmbed: BetterEmbed,
  interaction: ButtonInteraction
  userData: UserData,
  selected: string
}) {
  const locales = interaction.client.regionLocales;
  let userAPIData: UserAPIData = await SQLiteWrapper.getUser({
    discordID: interaction.user.id,
    table: 'api',
    columns: ['modules'],
  }) as UserAPIData;

  const userModules = userAPIData.modules?.split(' ') ?? []; //Extra logic to allow for concurrent instances of this command
  const selectedModuleIndex = userModules.indexOf(selected);
  if (interaction.customId === 'disableButton' && selectedModuleIndex !== -1) userModules.splice(selectedModuleIndex, 1);
  else if (interaction.customId === 'enableButton' && selectedModuleIndex === -1) userModules.push(selected);

  userAPIData = await SQLiteWrapper.updateUser({
    discordID: interaction.user.id,
    table: 'api',
    data: {
      modules: userModules.join(' '),
    },
  }) as UserAPIData;

  const modules = locales.get('commands.modules.modules', userData.language) as unknown as AssetModules;
  moduleEmbed
    .setFields(
      {
        name: `${modules[selected as keyof typeof modules].label} Module`,
        value: modules[selected as keyof typeof modules].longDescription,
      },
      {
        name: locales.localizer('commands.modules.statusField.name', userData.language),
        value: Boolean((userAPIData.modules?.split(' ') ?? []).includes(selected)) ?
          locales.localizer('commands.modules.statusField.added', userData.language) :
          locales.localizer('commands.modules.statusField.removed', userData.language),
      },
    );

  await interaction.update({
    embeds: [moduleEmbed],
    components: [
      userModuleSelectMenu({ locales: locales, userData: userData, selected: selected }),
      moduleButtons({ locales: locales, userData: userData, isEnabled: (userAPIData.modules?.split(' ') ?? [])?.includes(selected) }),
    ],
  });
}

function userModuleSelectMenu({
  locales,
  userData,
  selected,
  disabled,
}: {
  locales: RegionLocales,
  userData: UserData,
  selected?: string,
  disabled?: boolean,
}): MessageActionRow {
  const selectMenuOptions: MessageSelectOptionData[] = [];
  const modules = locales.get('commands.modules.modules', userData.language) as unknown as AssetModules;
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
        .setPlaceholder(locales.localizer('commands.modules.menuPlaceholder', userData.language))
        .addOptions(selectMenuOptions)
        .setDisabled(disabled ?? false),
    );
};

function moduleButtons({
  locales,
  userData,
  isEnabled, //If the module in question is enabled
  allDisabled,
}: {
  locales: RegionLocales,
  userData: UserData,
  isEnabled: boolean
  allDisabled?: boolean,
}): MessageActionRow {
  const buttons: MessageActionRowComponentResolvable[] = [];
  const components = locales.get('commands.modules.buttons', userData.language) as unknown as ModuleButtons;
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