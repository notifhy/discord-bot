import { MessageActionRow, MessageButton } from 'discord.js';

export class ToggleButtons extends MessageActionRow {
  constructor({
    allDisabled,
    enabled,
    enabledLabel,
    disabledLabel,
  }: {
    allDisabled?: boolean,
    enabled: boolean,
    enabledLabel: string,
    disabledLabel: string,
  }) {
    super();
    const enable = new MessageButton()
      .setCustomId('enable')
      .setStyle(allDisabled ? 'SECONDARY' : 'SUCCESS')
      .setLabel(enabledLabel)
      .setDisabled(allDisabled || enabled);

    const disable = new MessageButton()
      .setCustomId('disable')
      .setStyle(allDisabled ? 'SECONDARY' : 'DANGER')
      .setLabel(disabledLabel)
      .setDisabled(allDisabled || enabled === false); //Flips boolean

    super.setComponents([enable, disable]);
  }
}