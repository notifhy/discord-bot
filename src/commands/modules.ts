import type { CommandExecute, CommandProperties } from '../@types/client';
import { ButtonInteraction, CommandInteraction, Message, MessageActionRow, MessageActionRowComponentResolvable, MessageButton, MessageButtonStyleResolvable, MessageComponentInteraction, MessageSelectMenu, MessageSelectOptionData, SelectMenuInteraction } from 'discord.js';
import { BetterEmbed } from '../util/utility';
import type { FriendModule, FriendModuleUpdate, UserAPIData, UserData } from '../@types/database';
import { SQLiteWrapper } from '../database';
import { AssetModules } from '../@types/modules';
import { Locale, ModuleButtons } from '../@types/locales';

export const properties: CommandProperties = {
  name: 'modules',
  description: 'placeholder',
  usage: '/modules',
  cooldown: 15_000,
  ephemeral: true,
  noDM: false,
  ownerOnly: false,
  structure: {
    name: 'modules',
    description: 'Add or remove modules for your Minecraft account',
    options: [
      {
        name: 'defender',
        type: '1',
        description: 'placeholder',
      },
      {
        name: 'friend',
        description: 'placeholder',
        type: '1',
      },
      {
        name: 'rewards',
        description: 'placeholder',
        type: '1',
      },
    ],
  },
};

export const execute: CommandExecute = async (interaction: CommandInteraction, { userData }): Promise<void> => {
  if (interaction.options.getSubcommand() === 'friend') {
    await friend(interaction, { userData });
  }
};

async function friend(interaction: CommandInteraction, { userData }: { userData: UserData }) {
  const locale = interaction.client.regionLocales.locale(userData.language).commands.modules.friend;
  const mainEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .setTitle(locale.title)
    .setDescription(locale.description);

  const mainMenu = ({
    defaultV, disabled,
  }: {
    defaultV?: string, disabled?: boolean,
  }) => {
    const menu = new MessageSelectMenu()
      .setCustomId('main')
      .setPlaceholder(locale.menuPlaceholder)
      .setDisabled(disabled ?? false);
    const menuData = locale.menu;
    for (const item in menuData) {
      if (Object.prototype.hasOwnProperty.call(menuData, item)) {
        const itemData = menuData[item as keyof typeof menuData];
        menu.addOptions([{
          label: itemData.label,
          value: itemData.value,
          description: itemData.description,
          default: Boolean(defaultV === itemData.value),
        }]);
      }
    }
    return new MessageActionRow().addComponents(menu);
  };

  const reply = await interaction.editReply({ embeds: [mainEmbed], components: [mainMenu({})] });

  await interaction.client.channels.fetch(interaction.channelId);

  const customIDs = ['main', 'enable', 'disable', 'channel'];
  const filter = (i: MessageComponentInteraction) =>
    interaction.user.id === i.user.id && i.message.id === reply.id && customIDs.includes(i.customId);

  const collector = interaction!.channel!.createMessageComponentCollector({
    filter: filter,
    idle: 150_000,
  });

  let selected: string;
  collector.on('collect', async (i: SelectMenuInteraction | ButtonInteraction) => {
    const userFriendData = await SQLiteWrapper.getUser<FriendModule, FriendModule>({
      discordID: userData.discordID,
      table: 'friend',
      columns: ['discordID', 'enabled', 'channel'],
      allowUndefined: false,
    }) as FriendModule;

    if (i.isSelectMenu()) {
      selected = i.values[0];

      const updatedEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
        .setTitle(locale.title)
        .setDescription(locale.description) //Add explanation for unable to toggle
        .addField(locale.menu[selected as keyof typeof locale['menu']].label,
          locale.menu[selected as keyof typeof locale['menu']].longDescription);

      let component: MessageActionRow;

      switch (selected) {
        case 'toggle': {
          const enableButton = new MessageButton()
            .setCustomId('enable')
            .setStyle('SUCCESS')
            .setLabel(locale.menu.toggle.enableButton)
            .setDisabled(Boolean(userFriendData.channel) === false || Boolean(userFriendData.enabled));
          const disableButton = new MessageButton()
            .setCustomId('disable')
            .setStyle('DANGER')
            .setLabel(locale.menu.toggle.disableButton)
            .setDisabled(Boolean(userFriendData.enabled) === false); //Flips boolean
          component = new MessageActionRow().setComponents(enableButton, disableButton);
          break;
        }
        case 'channel': {
          const channelMenu = new MessageSelectMenu()
            .setCustomId('channel')
            .setPlaceholder('Currently Unavailable')
            .setDisabled(true)
            .setOptions({
              label: 'Unavailable',
              value: 'unavailable',
              description: 'This is unavailable',
            });
          component = new MessageActionRow().setComponents(channelMenu);
          break;
        }
      }

      await i.update({ embeds: [updatedEmbed], components: [mainMenu({ defaultV: selected }), component!] });
    } else {
      // eslint-disable-next-line no-lonely-if
      if (i.customId === 'enable' || i.customId === 'disable') {
        userFriendData.enabled = Number(Boolean(userFriendData.enabled) === false);
        await SQLiteWrapper.updateUser<FriendModuleUpdate>({
          discordID: userFriendData.discordID,
          table: 'friend',
          data: {
            enabled: userFriendData.enabled,
          },
        });
      }
    }
  });
};