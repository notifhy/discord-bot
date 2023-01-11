import { APIEmbedField, CommandInteraction, EmbedBuilder, normalizeArray, RestOrArray } from 'discord.js';

type Footer =
    | {
        text: string;
        iconURL?: string;
    }
    | CommandInteraction;

export class BetterEmbed extends EmbedBuilder {
    public constructor(footer?: Footer) {
        super();
        this.setTimestamp();

        if (footer instanceof CommandInteraction) {
            const interaction = footer;
            const avatar = interaction.user.displayAvatarURL();

            this.setFooter({
                text: `/${interaction.commandName}`,
                iconURL: avatar,
            });
        } else if (typeof footer !== 'undefined') {
            this.setFooter({
                text: footer.text,
                iconURL: footer.iconURL,
            });
        }
    }

    public unshiftFields(...fields: RestOrArray<APIEmbedField>) {
        this.data.fields?.unshift(...normalizeArray(fields));

        return this;
    }
}
