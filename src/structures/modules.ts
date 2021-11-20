import { CommandInteraction, MessageActionRow, MessageSelectMenu, SelectMenuInteraction } from 'discord.js';
import { Locale } from '../@types/locales';
import { BetterEmbed } from '../util/utility';
import Constants from '../util/constants';

export const mainMenu = ({
  defaultV,
  disabled,
  locale,
}: {
  defaultV?: string,
  disabled?: boolean,
  locale: Locale['commands']['modules'][keyof Locale['commands']['modules']]
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

export const mainMenuUpdateEmbed = ({
  interaction,
  locale,
  selected,
}: {
  interaction: CommandInteraction,
  locale: Locale['commands']['modules']['friend'],
  selected: string,
}) => {
  const updatedEmbed = new BetterEmbed({ color: Constants.color.normal, footer: interaction })
    .setTitle(locale.title)
    .setDescription(locale.description) //Add explanation for unable to toggle
    .addField(locale.menu[selected as keyof typeof locale['menu']].label,
      locale.menu[selected as keyof typeof locale['menu']].longDescription);
  return updatedEmbed;
};