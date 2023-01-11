import { setTimeout } from 'node:timers/promises';
import type { Command, UserError } from '@sapphire/framework';
import type {
    ChatInputCommandInteraction,
    ColorResolvable,
    ContextMenuCommandInteraction,
} from 'discord.js';
import { BaseInteractionErrorHandler } from './BaseInteractionErrorHandler';
import { Identifier } from '../enums/Identifier';
import { Time } from '../enums/Time';
import { ErrorHandler } from './ErrorHandler';
import { BetterEmbed } from '../structures/BetterEmbed';
import { cleanRound } from '../utility/utility';
import { Options } from '../utility/Options';

export class InteractionPreconditionErrorHandler<
    I extends ChatInputCommandInteraction | ContextMenuCommandInteraction,
> extends BaseInteractionErrorHandler<UserError, I> {
    public readonly command: Command;

    public constructor(error: UserError, interaction: I, command: Command) {
        super(error, interaction);
        this.command = command;
    }

    public async init() {
        try {
            this.log(
                `${this.interaction.user.id} failed ${this.error.identifier}.`,
            );

            this.sentry
                .setSeverity('warning')
                .baseInteractionPreconditionContext(this.error.identifier)
                .captureMessages(this.error.identifier);

            switch (this.error.identifier) {
                case Identifier.Cooldown:
                    await this.resolvePrecondition(
                        this.interaction,
                        this.interaction.i18n.getMessage('errorsPreconditionCooldownWaitingTitle'),
                        this.interaction.i18n.getMessage(
                            'errorsPreconditionCooldownWaitingDescription',
                            [
                                this.command.options.cooldownLimit!,
                                this.command.options.cooldownDelay! / Time.Second,
                                cleanRound(
                                    (
                                        this.error.context as {
                                            remaining: number;
                                        }
                                    ).remaining / Time.Second,
                                ),
                            ],
                        ),
                        Options.colorsWarning,
                    );

                    await setTimeout(
                        (
                            this.error.context as {
                                remaining: number;
                            }
                        ).remaining,
                    );

                    await this.resolvePrecondition(
                        this.interaction,
                        this.interaction.i18n.getMessage(
                            'errorsPreconditionCooldownCooldownOverTitle',
                        ),
                        this.interaction.i18n.getMessage(
                            'errorsPreconditionCooldownCooldownOverDescription',
                            [this.interaction.commandName],
                        ),
                        Options.colorsOn,
                    );
                    break;
                case Identifier.DevMode:
                    await this.resolvePrecondition(
                        this.interaction,
                        this.interaction.i18n.getMessage('errorsPreconditionDevModeTitle'),
                        this.interaction.i18n.getMessage('errorsPreconditionDevModeDescription'),
                        Options.colorsWarning,
                    );
                    break;
                case Identifier.GuildOnly:
                    await this.resolvePrecondition(
                        this.interaction,
                        this.interaction.i18n.getMessage('errorsPreconditionGuildOnlyTitle'),
                        this.interaction.i18n.getMessage('errorsPreconditionGuildOnlyDescription'),
                        Options.colorsWarning,
                    );
                    break;
                case Identifier.OwnerOnly:
                    await this.resolvePrecondition(
                        this.interaction,
                        this.interaction.i18n.getMessage('errorsPreconditionOwnerTitle'),
                        this.interaction.i18n.getMessage('errorsPreconditionOwnerDescription'),
                        Options.colorsWarning,
                    );
                    break;
                case Identifier.Registration:
                    await this.resolvePrecondition(
                        this.interaction,
                        this.interaction.i18n.getMessage('errorsPreconditionRegistrationTitle'),
                        this.interaction.i18n.getMessage(
                            'errorsPreconditionRegistrationDescription',
                        ),
                        Options.colorsWarning,
                    );
                    break;

                // TODO: Support client/user local/global permissions
                // no default
            }
        } catch (error) {
            new ErrorHandler(error, this.incidentId).init();
        }
    }

    private async resolvePrecondition(
        interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
        title: string,
        description: string,
        color: ColorResolvable,
    ) {
        const embed = new BetterEmbed(interaction)
            .setColor(color)
            .setTitle(title)
            .setDescription(description);

        await interaction.editReply({
            embeds: [embed],
        });
    }
}
