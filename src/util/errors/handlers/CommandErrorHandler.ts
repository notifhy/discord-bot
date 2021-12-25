import { sendWebHook, slashCommandResolver } from '../../utility';
import { CommandInteraction, TextChannel } from 'discord.js';
import {
    fatalWebhook,
    nonFatalWebhook,
    ownerID,
} from '../../../../config.json';
import BaseErrorHandler from './BaseErrorHandler';
import ConstraintError from '../ConstraintError';
import Constants from '../../Constants';

export class CommandErrorHandler extends BaseErrorHandler {
    interaction: CommandInteraction;

    constructor(error: unknown, interaction: CommandInteraction) {
        super(error);
        this.interaction = interaction;
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
            { name: 'User', value: `Tag: ${user.tag}\nID: ${user.id}` },
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
                Guild Member Count: ${guild?.memberCount}`,
            },
            {
                name: 'Channel',
                value: `Channel ID: ${channel?.id}
                Channel Type: ${channel?.type}
                Name: ${
                    channel instanceof TextChannel ? channel.name : 'N/A'
                }`,
            },
            { name: 'Other', value: `Websocket Ping: ${client.ws.ping}` },
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
        const { commandName, id } = this.interaction;

        if (this.error instanceof ConstraintError) {
            return;
        }

        const embed = this.errorEmbed()
            .setTitle('Oops')
            .setDescription(
                `An error occurred while executing the command /${commandName}! This error has been automatically forwarded for review. It should be resolved soon. Sorry.`,
            )
            .addField('Interaction ID', id);

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