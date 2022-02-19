import type {
    ButtonData,
    LocaleButton,
} from '../@types/locales';
import {
    Constants,
    MessageActionRow,
    MessageButton,
} from 'discord.js';

export class ToggleButtons extends MessageActionRow {
    constructor({
        allDisabled,
        enabled,
        buttonLocale,
    }: {
        allDisabled: boolean,
        enabled: boolean,
        buttonLocale: LocaleButton & ButtonData,
    }) {
        super();
        const enable = new MessageButton()
            .setCustomId(buttonLocale.enableCustomID)
            .setStyle(
                allDisabled
                    ? Constants.MessageButtonStyles.SECONDARY
                    : Constants.MessageButtonStyles.SUCCESS,
            )
            .setLabel(buttonLocale.enable)
            .setDisabled(allDisabled || enabled);

        const disable = new MessageButton()
            .setCustomId(buttonLocale.disableCustomID)
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