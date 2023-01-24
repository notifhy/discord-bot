import { APIEmbedField, CommandInteraction, EmbedBuilder, normalizeArray, RestOrArray } from 'discord.js';

export class BetterEmbed extends EmbedBuilder {
    public constructor(interaction?: CommandInteraction) {
        super();
        this.setTimestamp();

        if (interaction) {
            const avatar = interaction.user.displayAvatarURL();

            this.setFooter({
                text: `/${interaction.commandName}`,
                iconURL: avatar,
            });
        }
    }

    public unshiftFields(...fields: RestOrArray<APIEmbedField>) {
        this.data.fields?.unshift(...normalizeArray(fields));

        return this;
    }
}
