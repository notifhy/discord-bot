import { ChannelTypes } from 'discord.js/typings/enums';
import {
    Formatters,
    Permissions,
} from 'discord.js';
import type {
    BaseEmbed,
    Channel,
} from '../@types/locales';
import type { ClientCommand } from '../@types/client';
import type {
    DefenderModule,
    FriendsModule,
    Table,
} from '../@types/database';
import { Constants } from '../utility/Constants';
import { RegionLocales } from '../locales/RegionLocales';
import { SQLite } from '../utility/SQLite';
import { Log } from '../utility/Log';
import { BetterEmbed } from '../utility/utility';

export const properties: ClientCommand['properties'] = {
    name: 'channel',
    description: 'Modify the channel for the Defender or Friends Module. You must use this in a server.',
    cooldown: 5_000,
    ephemeral: true,
    noDM: true,
    ownerOnly: false,
    requireRegistration: true,
    structure: {
        name: 'channel',
        description: 'Configure a channel for the Defender or Friends Module',
        options: [
            {
                name: 'defender',
                description: 'Set or remove the channel from the Defender Module',
                type: 2,
                options: [
                    {
                        name: 'set',
                        description: 'Set a channel for the Defender Module',
                        type: 1,
                        options: [
                            {
                                name: 'channel',
                                description: 'A channel to send alerts to',
                                type: 7,
                                channel_types: [ChannelTypes.GUILD_TEXT],
                                required: true,
                            },
                        ],
                    },
                    {
                        name: 'remove',
                        type: 1,
                        description: 'Remove the channel from the Defender Module and send alerts via DMs',
                    },
                ],
            },
            {
                name: 'friends',
                description: 'Set a channel for the Friends Module',
                type: 2,
                options: [
                    {
                        name: 'set',
                        description: 'Set a channel for the Friends Module',
                        type: 1,
                        options: [
                            {
                                name: 'channel',
                                description: 'A channel to send logins and logouts to',
                                type: 7,
                                channel_types: [ChannelTypes.GUILD_TEXT],
                                required: true,
                            },
                        ],
                    },
                ],
            },
        ],
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const { replace } = RegionLocales;

    if (!interaction.inCachedGuild()) {
        return;
    }

    const channel = interaction.options.getChannel('channel');
    const type = interaction.options.getSubcommandGroup() === 'friends'
        ? 'friends'
        : 'defender';

    const baseLocale = RegionLocales.locale(locale).commands.channel;
    const { alreadySet } = baseLocale[type];

    if (channel?.viewable === false) {
        const missingPermission = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle(baseLocale.botMissingPermission.title)
            .setDescription(baseLocale.botMissingPermission.description);

        Log.interaction(interaction, 'Channel not viewable');

        await interaction.editReply({ embeds: [missingPermission] });

        return;
    }

    const userHasPermission = interaction.channel!
        .permissionsFor(interaction.member)
        .any([
            Permissions.FLAGS.MANAGE_CHANNELS,
            Permissions.FLAGS.MANAGE_WEBHOOKS,
        ]);

    if (userHasPermission === false) {
        const missingPermission = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle(baseLocale.userMissingPermission.title)
            .setDescription(baseLocale.userMissingPermission.description);

        Log.interaction(interaction, 'User missing permission');

        await interaction.editReply({ embeds: [missingPermission] });

        return;
    }

    let table: Table;
    let text: BaseEmbed;

    switch (type) {
        case 'defender':
            table = Constants.tables.defender;
            text = (
                baseLocale[type] as Channel['defender']
            )[channel ? 'set' : 'remove'];
            break;
        case 'friends':
            table = Constants.tables.friends;
            text = baseLocale[type].set;
        // no default
    }

    const { channel: currentChannel } = SQLite.getUser<DefenderModule | FriendsModule>({
        discordID: interaction.user.id,
        table: table,
        allowUndefined: false,
        columns: [
            'channel',
        ],
    });

    if (currentChannel === (channel?.id ?? null)) {
        const alreadySetEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle(alreadySet.title)
            .setDescription(replace(alreadySet.description, {
                channel: channel
                    ? Formatters.channelMention(channel.id)
                    : `${baseLocale.dms}`,
            }));

        Log.interaction(interaction, 'Channel already set');

        await interaction.editReply({ embeds: [alreadySetEmbed] });

        return;
    }

    SQLite.updateUser<DefenderModule | FriendsModule>({
        discordID: interaction.user.id,
        table: table,
        data: {
            channel: channel?.id ?? null,
        },
    });

    const embed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(text.title)
        .setDescription(replace(text.description, {
            channel: channel
                ? Formatters.channelMention(channel.id)
                : 'something_has_gone_wrong',
        }));

    Log.interaction(interaction, 'Channel updated');

    await interaction.editReply({ embeds: [embed] });
};