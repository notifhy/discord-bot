import {
    BaseEmbed,
    Locale,
} from '../../@types/locales';
import {
    BetterEmbed,
    cleanRound,
    sendWebHook,
} from '../../util/utility';
import {
    ColorResolvable,
    CommandInteraction,
} from 'discord.js';
import { nonFatalWebhook } from '../../../config.json';
import { RegionLocales } from '../../../locales/RegionLocales';
import { setTimeout } from 'node:timers/promises';
import BaseCommandErrorHandler from './BaseCommandErrorHandler';
import Constants from '../../util/Constants';
import ConstraintError from '../ConstraintError';

export default class CommandConstraintErrorHandler
    extends BaseCommandErrorHandler<ConstraintError> {
    readonly interaction: CommandInteraction;
    readonly locale: string;

    constructor(
        error: ConstraintError,
        interaction: CommandInteraction,
        locale: string,
    ) {
        super(error, interaction);
        this.interaction = interaction;
        this.locale = locale;
    }

    static async init(
        error: ConstraintError,
        interaction: CommandInteraction,
        locale: string,
    ) {
        const handler =
            new CommandConstraintErrorHandler(error, interaction, locale);

        handler.errorLog();
        await handler.systemNotify();
        await handler.userNotify();
    }

    private errorLog() {
        this.log(`${this.interaction.user.tag} failed the constraint ${this.error.message}`);
    }

    private async userNotify() {
        const { commandName } = this.interaction;

        const text = RegionLocales
            .locale(this.locale)
            .errors;

        const constraint = text
                .constraintErrors[this.error.message as keyof Locale['errors']['constraintErrors']];

            if (this.error.message === 'cooldown') {
                const embed1 = (constraint as Locale['errors']['constraintErrors']['cooldown']).embed1;
                const embed2 = (constraint as Locale['errors']['constraintErrors']['cooldown']).embed2;

                const command =
                    this.interaction.client.commands.get(commandName);

                this.constraintResolver(
                    embed1.title,
                    RegionLocales.replace(embed1.description, {
                        cooldown:
                            (command?.properties.cooldown ?? 0) /
                            Constants.ms.second,
                        timeLeft:
                            cleanRound(this.error.cooldown! /
                            Constants.ms.second, 1),
                    }),
                );

                await setTimeout(this.error.cooldown!);

                this.constraintResolver(
                    embed2.title,
                    RegionLocales.replace(embed2.description, {
                        commandName: commandName,
                    }),
                    Constants.colors.on,
                );

                return;
            }

            const embed = constraint as BaseEmbed;

            this.constraintResolver(
                embed.title,
                embed.description,
            );
    }

    private async constraintResolver(
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

    private async systemNotify() {
        const embeds = [this.getGuildInformation()];

        embeds[0]
            .setTitle('User Failed Constraint')
            .setDescription(`Constraint: ${this.error.message}`);

        await sendWebHook({
            embeds: embeds,
            webhook: nonFatalWebhook,
            suppressError: true,
        });
    }
}