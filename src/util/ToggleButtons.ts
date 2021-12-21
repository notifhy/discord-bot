import { Constants, MessageActionRow, MessageButton } from 'discord.js';

type ButtonLocale = {
    enable: string;
    disable: string;
}


export class ToggleButtons extends MessageActionRow {
    constructor({
        allDisabled,
        enabled,
        buttonLocale,
    }: {
        allDisabled?: boolean;
        enabled: boolean;
        buttonLocale: ButtonLocale;
    }) {
        super();
        const enable = new MessageButton()
            .setCustomId('enable')
            .setStyle(
                allDisabled
                    ? Constants.MessageButtonStyles.SECONDARY
                    : Constants.MessageButtonStyles.SUCCESS,
            )
            .setLabel(buttonLocale.enable)
            .setDisabled(allDisabled || enabled);

        const disable = new MessageButton()
            .setCustomId('disable')
            .setStyle(
                allDisabled
                    ? Constants.MessageButtonStyles.SECONDARY
                    : Constants.MessageButtonStyles.DANGER,
            )
            .setLabel(buttonLocale.disable)
            .setDisabled(allDisabled || enabled === false); //Flips boolean

        super.setComponents([enable, disable]);
    }
}
