import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';
import {
    type ButtonData,
    type LocaleButton,
} from '../@types/locales';

export class ToggleButtons extends ActionRowBuilder {
    public constructor({
        allDisabled,
        enabled,
        buttonLocale,
    }: {
        allDisabled: boolean,
        enabled: boolean,
        buttonLocale: LocaleButton & ButtonData,
    }) {
        super();
        const enable = new ButtonBuilder()
            .setCustomId(buttonLocale.enableCustomID)
            .setStyle(
                allDisabled
                    ? ButtonStyle.Secondary
                    : ButtonStyle.Success,
            )
            .setLabel(buttonLocale.enable)
            .setDisabled(allDisabled || enabled);

        const disable = new ButtonBuilder()
            .setCustomId(buttonLocale.disableCustomID)
            .setStyle(
                allDisabled
                    ? ButtonStyle.Secondary
                    : ButtonStyle.Danger,
            )
            .setLabel(buttonLocale.disable)
            .setDisabled(allDisabled || enabled === false); // Flips boolean

        super.setComponents([enable, disable]);
    }
}