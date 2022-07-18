import {
    EmbedBuilder,
    type CommandInteraction,
} from 'discord.js';
import { BaseInteractionErrorHandler } from './BaseInteractionErrorHandler';
import { ErrorHandler } from './ErrorHandler';
import { RegionLocales } from '../locales/RegionLocales';
import { Constants } from '../utility/Constants';

export class CommandErrorHandler<E> extends BaseInteractionErrorHandler<E> {
    public readonly interaction: CommandInteraction;

    public readonly locale: string;

    public constructor(
        error: E,
        interaction: CommandInteraction,
        locale: string,
    ) {
        super(error, interaction);
        this.interaction = interaction;
        this.locale = locale;
    }

    public static async init<T>(
        error: T,
        interaction: CommandInteraction,
        locale: string,
    ) {
        const handler = new CommandErrorHandler(error, interaction, locale);

        try {
            handler.errorLog();
            handler.systemNotify();
            await handler.userNotify();
        } catch (error2) {
            await ErrorHandler.init(error2, handler.incidentID);
        }
    }

    private errorLog() {
        this.log(this.error);
    }

    private async userNotify() {
        const { commandName } = this.interaction;

        const text = RegionLocales
            .locale(this.locale)
            .errors;

        const { replace } = RegionLocales;

        const embed = new EmbedBuilder()
            .setColor(Constants.colors.error)
            .setTitle(text.commandErrors.embed.title)
            .setDescription(replace(text.commandErrors.embed.description, {
                commandName: commandName,
            }))
            .addFields({
                name: text.commandErrors.embed.field.name,
                value: replace(text.commandErrors.embed.field.value, {
                    id: this.incidentID,
                }),
            });

        const payLoad = { embeds: [embed], ephemeral: true };

        try {
            if (
                this.interaction.replied === true
                || this.interaction.deferred === true
            ) {
                await this.interaction.followUp(payLoad);
            } else {
                await this.interaction.reply(payLoad);
            }
        } catch (error) {
            this.log(
                'An error has occurred and also failed to notify the user',
                error,
            );

            this.sentry
                .setSeverity('error')
                .captureException(error);
        }
    }

    private systemNotify() {
        this.sentry
            .setSeverity('error')
            .captureException(this.error);
    }
}