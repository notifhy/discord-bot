import { BaseInteraction, EmbedBuilder } from 'discord.js';
import { BaseInteractionErrorHandler } from './BaseInteractionErrorHandler';
import { ErrorHandler } from './ErrorHandler';
import { Options } from '../utility/Options';

export class InteractionErrorHandler<
    E,
    I extends BaseInteraction,
> extends BaseInteractionErrorHandler<E, I> {
    public constructor(error: E, interaction: I, ...data: string[]) {
        super(error, interaction, ...data);
    }

    public async init() {
        try {
            this.report();

            await this.userNotify();
        } catch (error2) {
            new ErrorHandler(error2, this.incidentId).init();
        }
    }

    private async userNotify() {
        if (!this.interaction.isRepliable()) {
            this.log('Interaction is not repliable.');
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(Options.colorsError)
            .setTitle(this.i18n.getMessage('errorsInteractionReplyTitle'))
            .setDescription(this.i18n.getMessage('errorsInteractionReplyDescription'))
            .addFields({
                name: this.i18n.getMessage('errorsInteractionReplyIncidentName'),
                value: this.incidentId,
            });

        const payLoad = {
            embeds: [embed],
            ephemeral: true,
        };

        try {
            if (this.interaction.replied || this.interaction.deferred) {
                await this.interaction.followUp(payLoad);
            } else {
                await this.interaction.reply(payLoad);
            }
        } catch (error) {
            new ErrorHandler(
                error,
                this.incidentId,
                'An error has occurred and also failed to notify the user.',
            ).init();
        }
    }
}
