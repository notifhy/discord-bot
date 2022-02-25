import type { ActivityTypes } from 'discord.js/typings/enums';
import type { ClientCommand } from '../@types/client';
import type { ExcludeEnum, PresenceStatusData } from 'discord.js';
import { BetterEmbed } from '../../utility/utility';
import { Constants } from '../utility/Constants';
import { RegionLocales } from '../locales/RegionLocales';
import { setPresence } from '../utility/utility';

export const properties: ClientCommand['properties'] = {
    name: 'presence',
    description: 'Set a custom presence.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'presence',
        description: 'Set a custom presence for the bot',
        options: [
            {
                name: 'clear',
                type: 1,
                description: 'Clear the custom presence',
            },
            {
                name: 'set',
                description: 'Set a custom presence',
                type: 1,
                options: [
                    {
                        name: 'status',
                        type: 3,
                        description: 'The status to use',
                        required: true,
                        choices: [
                            {
                                name: 'Online',
                                value: 'online',
                            },
                            {
                                name: 'Idle',
                                value: 'idle',
                            },
                            {
                                name: 'Invisible',
                                value: 'invisible',
                            },
                            {
                                name: 'Do Not Disturb ',
                                value: 'dnd ',
                            },
                        ],
                    },
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
                                value: 'STREAMING',
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
    const text = RegionLocales.locale(locale).commands.presence;
    const { replace } = RegionLocales;

    const responseEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal);

    if (interaction.options.getSubcommand() === 'set') {
        const type = interaction.options.getString('type', true);
        const name = interaction.options.getString('name', true);
        const url = interaction.options.getString('url', false);
        const status = interaction.options.getString('status', true);

        interaction.client.customPresence = {
            activities: [{
                type: type as ExcludeEnum<typeof ActivityTypes, 'CUSTOM'>,
                name: name,
                url: url ?? undefined,
            }],
            status: status as PresenceStatusData,
        };

        responseEmbed
            .setTitle(text.set.title)
            .addFields([
                {
                    name: text.set.status.name,
                    value: replace(text.set.status.value, {
                        status: status,
                    }),
                },
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

        interaction.client.customPresence = null;
    }

    setPresence(interaction.client);

    await interaction.editReply({ embeds: [responseEmbed] });
};