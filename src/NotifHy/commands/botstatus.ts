import type { ActivityTypes } from 'discord.js/typings/enums';
import type { ClientCommand } from '../@types/client';
import type { ExcludeEnum } from 'discord.js';
import { BetterEmbed } from '../../util/utility';
import { Constants } from '../util/Constants';
import { Log } from '../../util/Log';
import { RegionLocales } from '../locales/RegionLocales';
import { setActivity } from '../util/utility';

export const properties: ClientCommand['properties'] = {
    name: 'botstatus',
    description: 'Set a custom status.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'botstatus',
        description: 'Set a custom for the bot',
        options: [
            {
                name: 'clear',
                type: 1,
                description: 'Clear the custom status',
            },
            {
                name: 'set',
                description: 'Set a custom status',
                type: 1,
                options: [
                    {
                        name: 'type',
                        type: 3,
                        description: 'The type to display',
                        required: true,
                        choices: [
                            {
                                name: 'Playing',
                                value: 'PLAYING',
                            },
                            {
                                name: 'Streaming',
                                value: 'WATCHING',
                            },
                            {
                                name: 'Listening',
                                value: 'LISTENING',
                            },
                            {
                                name: 'Watching',
                                value: 'WATCHING',
                            },
                            {
                                name: 'Competing',
                                value: 'COMPETING',
                            },
                        ],
                    },
                    {
                        name: 'name',
                        type: 3,
                        description: 'The message/name to display',
                        required: true,
                    },
                    {
                        name: 'url',
                        type: 3,
                        description: 'The url to stream at',
                        required: false,
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
    const text = RegionLocales.locale(locale).commands.botstatus;
    const { replace } = RegionLocales;

    const responseEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal);

    if (interaction.options.getSubcommand() === 'set') {
        const type = interaction.options.getString('type', true);
        const name = interaction.options.getString('name', true);
        const url = interaction.options.getString('url', false);

        interaction.client.customStatus = {
            type: type as ExcludeEnum<typeof ActivityTypes, 'CUSTOM'>,
            name: name,
            url: url ?? undefined,
        };

        responseEmbed
            .setTitle(text.set.title)
            .addFields([
                {
                    name: text.set.type.name,
                    value: replace(text.set.type.value, {
                        type: type,
                    }),
                },
                {
                    name: text.set.name.name,
                    value: replace(text.set.name.value, {
                        name: name,
                    }),
                },
                {
                    name: text.set.url.name,
                    value: replace(text.set.url.value, {
                        url: url ?? text.set.none,
                    }),
                },
            ]);
    } else {
        responseEmbed
            .setTitle(text.cleared.title)
            .setDescription(text.cleared.description);

        interaction.client.customStatus = null;
    }

    await setActivity(interaction.client);

    Log.command(interaction, responseEmbed.description);

    await interaction.editReply({ embeds: [responseEmbed] });
};