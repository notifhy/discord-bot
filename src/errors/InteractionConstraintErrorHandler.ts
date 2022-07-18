import { setTimeout } from 'node:timers/promises';
import {
    type ColorResolvable,
    type CommandInteraction,
} from 'discord.js';
import {
    BaseEmbed,
    type Locale,
} from '../@types/locales';
import { BaseInteractionErrorHandler } from './BaseInteractionErrorHandler';
import { type ConstraintError } from './ConstraintError';
import { ErrorHandler } from './ErrorHandler';
import { RegionLocales } from '../locales/RegionLocales';
import { Constants } from '../utility/Constants';
import {
    BetterEmbed,
    cleanRound,
} from '../utility/utility';

// eslint-disable-next-line max-len
export class InteractionConstraintErrorHandler extends BaseInteractionErrorHandler<ConstraintError> {
    public readonly interaction: CommandInteraction;

    public readonly locale: string;

    public constructor(
        error: ConstraintError,
        interaction: CommandInteraction,
        locale: string,
    ) {
        super(error, interaction);
        this.interaction = interaction;
        this.locale = locale;
    }

    public static async init(
        error: ConstraintError,
        interaction: CommandInteraction,
        locale: string,
    ) {
        const handler = new InteractionConstraintErrorHandler(error, interaction, locale);

        try {
            handler.errorLog();
            handler.systemNotify();
            await handler.userNotify();
        } catch (error2) {
            await ErrorHandler.init(error2, handler.incidentID);
        }
    }

    private errorLog() {
        this.log(`${this.interaction.user.id} failed the constraint ${this.error.message}`);
    }

    private async userNotify() {
        const { commandName } = this.interaction;

        const text = RegionLocales
            .locale(this.locale)
            .errors;

        const constraint = text.constraintErrors[
            this.error.message as keyof Locale['errors']['constraintErrors']
        ];

        if (this.error.message === 'cooldown') {
            const { embed1 } = constraint as
                    Locale['errors']['constraintErrors']['cooldown'];
            const { embed2 } = constraint as
                    Locale['errors']['constraintErrors']['cooldown'];

            const command = this.interaction.client.commands.get(commandName);

            this.resolveConstraint(
                embed1.title,
                RegionLocales.replace(embed1.description, {
                    cooldown:
                        (command?.properties.cooldown ?? 0)
                        / Constants.ms.second,
                    timeLeft: cleanRound(
                        this.error.cooldown!
                        / Constants.ms.second,
                        1,
                    ),
                }),
            );

            await setTimeout(this.error.cooldown!);

            this.resolveConstraint(
                embed2.title,
                RegionLocales.replace(embed2.description, {
                    commandName: commandName,
                }),
                Constants.colors.on,
            );

            return;
        }

        const embed = constraint as BaseEmbed;

        this.resolveConstraint(
            embed.title,
            embed.description,
        );
    }

    private async resolveConstraint(
        title: string,
        description: string,
        color?: ColorResolvable,
    ) {
        const embed = new BetterEmbed(this.interaction)
            .setColor(color ?? Constants.colors.warning)
            .setTitle(title)
            .setDescription(description);

        await this.interaction.editReply({
            embeds: [embed],
        });
    }

    private systemNotify() {
        this.sentry
            .setSeverity('warning')
            .baseInteractionConstraintContext(this.error.message)
            .captureMessages(this.error.message);
    }
}