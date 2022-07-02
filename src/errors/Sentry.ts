import * as SentryClient from '@sentry/node';
import {
    CommandInteraction,
    GuildChannel,
    type Interaction,
    TextChannel,
} from 'discord.js';
import { type Core } from '../core/cores';
import { slashCommandResolver } from '../utility/utility';
import { HTTPError } from './HTTPError';

export class Sentry {
    public readonly scope: SentryClient.Scope;

    public constructor() {
        this.scope = new SentryClient.Scope();
    }

    public baseErrorContext(incidentID: string) {
        this.scope.setTags({
            incidentID: incidentID,
        });

        return this;
    }

    public baseInteractionContext(interaction: Interaction) {
        const {
            user,
            guild,
            channel,
            client,
        } = interaction;

        this.scope.setTags({
            interactionCommand: interaction instanceof CommandInteraction
                ? slashCommandResolver(
                    interaction,
                ).slice(0, 200)
                : null,
            interactionCreatedTimestamp: interaction.createdTimestamp,
            userID: user.id,
            interactionID: interaction.id,
            guildID: guild?.id,
            guildName: guild?.name,
            guildOwnerID: guild?.ownerId,
            guildMemberCount: guild?.memberCount,
            guildPermissions: guild?.me?.permissions.bitfield.toString(),
            channelID: channel?.id,
            channelType: channel?.type,
            channelName: channel instanceof TextChannel
                ? channel.name
                : null,
            channelPermissions: channel instanceof GuildChannel
                ? guild?.me?.permissionsIn(channel).bitfield.toString()
                : null,
            ping: client.ws.ping,
        });

        return this;
    }

    public captureException(exception: unknown) {
        SentryClient.captureException(
            exception,
            this.scope,
        );

        return this;
    }

    public captureMessages(...messages: string[]) {
        messages.forEach((message) => {
            SentryClient.captureMessage(
                message,
                this.scope,
            );
        });

        return this;
    }

    public baseInteractionConstraintContext(constraint: string) {
        this.scope.setTags({
            constraint: constraint,
        });

        return this;
    }

    public moduleContext(userID: string, module: string) {
        this.scope.setTags({
            userID: userID,
            module: module,
        });

        return this;
    }

    public requestContext(error: unknown, core: Core) {
        this.scope.setTags({
            type: error instanceof Error
                ? error.name
                : null,
            resumingIn: core.error.getTimeout(),
            lastHourAbort: core.error.abort.lastHour,
            lastHourGeneric: core.error.generic.lastHour,
            lastHourHTTP: core.error.http.lastHour,
            nextTimeoutAbort: core.error.abort.timeout,
            nextTimeoutGeneric: core.error.generic.timeout,
            nextTimeoutHTTP: core.error.http.timeout,
            uses: core.request.uses,
            status: error instanceof HTTPError
                ? error.status
                : null,
            statusText: error instanceof HTTPError
                ? error.statusText
                : null,
        });

        return this;
    }

    public setSeverity(level: SentryClient.SeverityLevel) {
        this.scope.setLevel(level);

        return this;
    }
}