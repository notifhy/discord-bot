import {
    type CommandInteraction,
    type ContextMenuInteraction,
    type MessageComponentInteraction,
    MessageEmbed,
} from 'discord.js';
import { BaseInteractionErrorHandler } from './BaseInteractionErrorHandler';
import { ErrorHandler } from './ErrorHandler';
import { Options } from '../utility/Options';

export class InteractionErrorHandler<
    E,
    I extends CommandInteraction | ContextMenuInteraction | MessageComponentInteraction,
> extends BaseInteractionErrorHandler<E, I> {
    public constructor(error: E, interaction: I) {
        super(error, interaction);
    }

    public async init() {
        try {
            this.log(this.error);

            this.sentry.setSeverity('error').captureException(this.error);

            await this.userNotify();
        } catch (error2) {
            new ErrorHandler(error2, this.incidentId).init();
        }
    }

    private async userNotify() {
        const embed = new MessageEmbed()
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
            if (this.interaction.replied === true || this.interaction.deferred === true) {
                await this.interaction.followUp(payLoad);
            } else {
                await this.interaction.reply(payLoad);
            }
        } catch (error) {
            this.log(
                `${this.constructor.name}:`,
                'An error has occurred and also failed to notify the user.',
                error,
            );

            this.sentry.setSeverity('error').captureException(error);
        }
    }
}
