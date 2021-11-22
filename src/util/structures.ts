import { CommandInteraction, MessageActionRow, MessageButton } from 'discord.js';

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

export const slashCommandOptionString = (interaction: CommandInteraction) => {
  let option = interaction.options.data[0];

  const commandOptions: (string | number | boolean)[] = [];

  if (option) {
    if (option.value) {
      commandOptions.push(option.value);
    } else {
      if (option.type === 'SUB_COMMAND_GROUP') {
        commandOptions.push(option.name);
        option = option.options![0];
      }

      if (option.type === 'SUB_COMMAND') {
        commandOptions.push(option.name);
      }

      if (Array.isArray(option.options)) {
        option.options.forEach(subOption => {
          commandOptions.push(`${subOption.name}: ${subOption.value}`);
        });
      }
    }
  }

  return commandOptions;
};