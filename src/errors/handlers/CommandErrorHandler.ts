import {
    BetterEmbed,
    cleanRound,
    sendWebHook,
    slashCommandResolver,
} from '../../util/utility';
import {
    ColorResolvable,
    CommandInteraction,
    GuildChannel,
    MessageEmbed,
    TextChannel,
} from 'discord.js';
import {
    fatalWebhook,
    nonFatalWebhook,
    ownerID,
} from '../../../config.json';
import BaseErrorHandler from './BaseErrorHandler';
import ConstraintError from '../ConstraintError';
import Constants from '../../util/Constants';
import { RegionLocales } from '../../../locales/RegionLocales';
import {
    BaseEmbed,
    Locale,
} from '../../@types/locales';
import { setTimeout } from 'node:timers/promises';

export default class CommandErrorHandler extends BaseErrorHandler {
    readonly interaction: CommandInteraction;
    readonly locale: string;

    constructor(
        error: unknown,
        interaction: CommandInteraction,
        locale: string,
    ) {
        super(error);
        this.interaction = interaction;
        this.locale = locale;
        this.errorLog();
    }

    private baseGuildEmbed() {
        const {
            client,
            channel,
            createdTimestamp,
            guild,
            id,
            user,
        } = this.interaction;

        const command = slashCommandResolver(
            this.interaction,
        );

        return this.errorEmbed().addFields([
            {
                name: 'User',
                value: `Tag: ${user.tag}
                ID: ${user.id}`,
            },
            {
                name: 'Interaction',
                value: `ID: ${id}
                Command: ${command}
                Created At: <t:${Math.round(
                    createdTimestamp / Constants.ms.second,
                )}:T>`,
            },
            {
                name: 'Guild',
                value: `Guild ID: ${guild?.id}
                Guild Name: ${guild?.name}
                Owner ID: ${guild?.ownerId ?? 'None'}
                Guild Member Count: ${guild?.memberCount}
                Permissions: ${guild?.me?.permissions.bitfield}`,
            },
            {
                name: 'Channel',
                value: `Channel ID: ${channel?.id}
                Channel Type: ${channel?.type}
                Name: ${channel instanceof TextChannel ? channel.name : 'N/A'}
                Permissions: ${
                    channel instanceof GuildChannel
                        ? guild?.me?.permissionsIn(channel).bitfield
                        : 'N/A'
                }`,
            },
            {
                name: 'Other',
                value: `Websocket Ping: ${client.ws.ping}`,
            },
        ]);
    }

    private errorLog() {
        if (this.error instanceof ConstraintError) {
            this.log(`${this.interaction.user.tag} failed the constraint ${this.error.message}`);
        } else {
            this.log(this.error);
        }
    }

    async userNotify() {
        const { commandName } = this.interaction;

        const text = RegionLocales
            .locale(this.locale)
            .errors;

        const { replace } = RegionLocales;

        if (this.error instanceof ConstraintError) {
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

            return;
        }

        const embed = new MessageEmbed()
        .setColor(Constants.colors.error)
            .setTitle(text.commandErrors.embed.title)
            .setDescription(replace(text.commandErrors.embed.description, {
                commandName: commandName,
            }))
            .addField(
                text.commandErrors.embed.field.name,
                replace(text.commandErrors.embed.field.value, {
                    id: this.incidentID,
                }),
            );

        const payLoad = { embeds: [embed], ephemeral: true };

        try {
            if (
                this.interaction.replied === true ||
                this.interaction.deferred === true
            ) {
                await this.interaction.followUp(payLoad);
            } else {
                await this.interaction.reply(payLoad);
            }
        } catch (err) {
            const message = 'An error has occurred and also failed to notify the user';

            this.log(message, err);

            const stackEmbed = this.errorStackEmbed(err);

            await sendWebHook({
                content: `<@${ownerID.join('><@')}> ${message}.`,
                embeds: [stackEmbed],
                webhook: fatalWebhook,
                suppressError: true,
            });
        }
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

    async systemNotify() {
        const embeds = [this.baseGuildEmbed()];

        if (this.error instanceof ConstraintError) {
            embeds[0]
                .setTitle('User Failed Constraint')
                .setDescription(`Constraint: ${this.error.message}`);
        } else {
            embeds[0]
                .setTitle('Unexpected Error');

            embeds
                .push(this.errorStackEmbed(this.error));
        }

        await sendWebHook({
            content:
                this.error instanceof ConstraintError
                    ? undefined
                    : `<@${ownerID.join('><@')}>`,
            embeds: embeds,
            webhook:
                this.error instanceof ConstraintError
                    ? nonFatalWebhook
                    : fatalWebhook,
            suppressError: true,
        });
    }
}