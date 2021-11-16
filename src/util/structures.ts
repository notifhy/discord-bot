import { MessageActionRow, MessageButton } from 'discord.js';

export class ToggleButtons extends MessageActionRow {
  private enable: MessageButton;
  private disable: MessageButton;

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
    this.enable = new MessageButton()
      .setCustomId('enable')
      .setStyle(allDisabled ? 'SECONDARY' : 'SUCCESS')
      .setLabel(enabledLabel)
      .setDisabled(allDisabled || enabled);

    this.disable = new MessageButton()
      .setCustomId('disable')
      .setStyle(allDisabled ? 'SECONDARY' : 'DANGER')
      .setLabel(disabledLabel)
      .setDisabled(allDisabled || enabled === false); //Flips boolean

    super.setComponents([this.enable, this.disable]);
  }
}