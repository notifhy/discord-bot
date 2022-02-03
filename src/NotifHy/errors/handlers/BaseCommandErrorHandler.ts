import {
    CommandInteraction,
    GuildChannel,
    TextChannel,
} from 'discord.js';
import { slashCommandResolver } from '../../../util/utility';
import BaseErrorHandler from './BaseErrorHandler';
import Constants from '../../../util/Constants';

export default class CommandErrorHandler<E> extends BaseErrorHandler<E> {
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
            .addFields([
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
                    Name: ${channel instanceof TextChannel
                        ? channel.name
                        : 'N/A'
                    }
                    Permissions: ${channel instanceof GuildChannel
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
}