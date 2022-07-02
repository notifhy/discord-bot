import {
    CommandInteraction,
    GuildChannel,
    TextChannel,
} from 'discord.js';
import { BaseErrorHandler } from './BaseErrorHandler';
import { GlobalConstants } from '../../utility/Constants';
import { slashCommandResolver } from '../utility/utility';

export class BaseCommandErrorHandler<E> extends BaseErrorHandler<E> {
    readonly interaction: CommandInteraction;

    constructor(
        error: E,
        interaction: CommandInteraction,
    ) {
        super(error);
        this.interaction = interaction;
    }

    getGuildInformation() {
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

        return this.baseErrorEmbed()
            .addFields(
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
                        createdTimestamp / GlobalConstants.ms.second,
                    )}:T>`,
                },
                {
                    name: 'Guild',
                    value: `Guild ID: ${guild?.id ?? 'N/A'}
                    Guild Name: ${guild?.name ?? 'N/A'}
                    Owner ID: ${guild?.ownerId ?? 'N/A'}
                    Guild Member Count: ${guild?.memberCount ?? 'N/A'}
                    Permissions: ${guild?.me?.permissions.bitfield ?? 'N/A'}`,
                },
                {
                    name: 'Channel',
                    value: `Channel ID: ${channel?.id ?? 'N/A'}
                    Channel Type: ${channel?.type ?? 'N/A'}
                    Name: ${
                        channel instanceof TextChannel
                            ? channel.name
                            : 'N/A'
                    }
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
            );
    }
}