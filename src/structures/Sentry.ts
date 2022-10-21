import { DiscordAPIError } from '@discordjs/rest';
import type { users as User } from '@prisma/client';
import * as SentryClient from '@sentry/node';
import { CommandInteraction, GuildChannel, type Interaction, TextChannel } from 'discord.js';
import type { Core } from '../core/Core';
import { HTTPError } from '../errors/HTTPError';
import type { Module } from './Module';
import { slashCommandResolver } from '../utility/utility';

export class Sentry {
    public readonly scope: SentryClient.Scope;

    public constructor() {
        this.scope = new SentryClient.Scope();
    }

    public baseErrorContext(incidentId: string) {
        this.scope.setTags({
            incidentId: incidentId,
        });

        return this;
    }

    public baseInteractionContext(interaction: Interaction) {
        const { user, guild, channel, client } = interaction;

        this.scope.setTags({
            interactionCommand:
                interaction instanceof CommandInteraction
                    ? slashCommandResolver(interaction).slice(0, 200)
                    : null,
            interactionCreatedTimestamp: interaction.createdTimestamp,
            userId: user.id,
            interactionId: interaction.id,
            guildId: guild?.id,
            guildName: guild?.name,
            guildOwnerId: guild?.ownerId,
            guildMemberCount: guild?.memberCount,
            guildPermissions: guild?.me?.permissions.bitfield.toString(),
            channelId: channel?.id,
            channelType: channel?.type,
            channelName: channel instanceof TextChannel ? channel.name : null,
            channelPermissions:
                channel instanceof GuildChannel
                    ? guild?.me?.permissionsIn(channel).bitfield.toString()
                    : null,
            ping: client.ws.ping,
        });

        return this;
    }

    public captureException(exception: unknown) {
        SentryClient.captureException(exception, this.scope);

        return this;
    }

    public captureMessages(...messages: string[]) {
        messages.forEach((message) => {
            SentryClient.captureMessage(message, this.scope);
        });

        return this;
    }

    public baseInteractionPreconditionContext(precondition: string) {
        this.scope.setTags({
            precondition: precondition,
        });

        return this;
    }

    public moduleContext(error: unknown, module: Module, user: User) {
        this.scope.setTags({
            cause: error instanceof DiscordAPIError ? String(error.cause) : null,
            isDiscordAPIError: error instanceof DiscordAPIError,
            message: error instanceof DiscordAPIError ? error.message : null,
            module: module.name,
            userId: user.id,
            userUUID: user.uuid,
        });

        return this;
    }

    public requestContext(error: unknown) {
        this.scope.setTags({
            type: error instanceof Error ? error.name : null,
            status: error instanceof HTTPError ? error.status : null,
            statusText: error instanceof HTTPError ? error.statusText : null,
        });

        return this;
    }

    public requestContextCore(core: Core) {
        this.scope.setTags({
            resumingIn: core.errors.getTimeout(),
            lastHourAbort: core.errors.abort.getLastHour(),
            lastHourGeneric: core.errors.generic.getLastHour(),
            lastHourHTTP: core.errors.http.getLastHour(),
            nextTimeoutAbort: core.errors.abort.getTimeout(),
            nextTimeoutGeneric: core.errors.generic.getTimeout(),
            nextTimeoutHTTP: core.errors.http.getTimeout(),
            uses: core.requests.uses,
        });

        return this;
    }

    public setSeverity(level: SentryClient.SeverityLevel) {
        this.scope.setLevel(level);

        return this;
    }
}
