import type { BaseEmbed, Channel } from '../@types/locales';
import type { ClientCommand } from '../@types/client';
import type { DefenderModule, FriendsModule, Tables } from '../@types/database';
import { BetterEmbed } from '../../util/utility';
import { ChannelTypes } from 'discord.js/typings/enums';
import { Formatters } from 'discord.js';
import { RegionLocales } from '../../../locales/RegionLocales';
import { SQLite } from '../../util/SQLite';
import Constants from '../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'channel',
    description: 'Modify the channel for the Defender or Friends Module. You must use this in a server.',
    cooldown: 5_000,
    ephemeral: true,
    noDM: false,
    ownerOnly: false,
    requireRegistration: true,
    structure: {
        name: 'channel',
        description: 'Set a channel for the Defender or Friends Module',
        options: [
            {
                name: 'defender',
                description: 'Add or remove the channel from the Defender Module',
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
};

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const { replace } = RegionLocales;

    const channel = interaction.options.getChannel('channel');
    const type = interaction.options.getSubcommand() === 'friends'
        ? 'friends'
        : 'defender';

    const baseLocale = RegionLocales.locale(locale).commands.channel;
    const alreadySet = baseLocale[type].alreadySet;

    let table: Tables;
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
        //No default
    }

    const { channel: currentChannel } =
        await SQLite.getUser<DefenderModule | FriendsModule>({
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

        await interaction.editReply({ embeds: [alreadySetEmbed] });

        return;
    }

    await SQLite.updateUser<DefenderModule | FriendsModule>({
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
                : 'not_a_value',
        }));

    await interaction.editReply({ embeds: [embed] });
};