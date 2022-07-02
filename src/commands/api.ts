import type { ClientCommand } from '../@types/client';
import { Constants } from '../utility/Constants';
import { keyLimit } from '../../config.json';
import { RegionLocales } from '../locales/RegionLocales';
import { Log } from '../utility/Log';
import { BetterEmbed, cleanLength, cleanRound } from '../utility/utility';

export const properties: ClientCommand['properties'] = {
    name: 'api',
    description: 'Configure the bot.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'api',
        description: 'Toggles dynamic settings',
        options: [
            {
                name: 'stats',
                type: 1,
                description: 'Returns some stats about the API Request Handler',
            },
            {
                name: 'set',
                type: 1,
                description: 'Set data for the API Request Handler',
                options: [
                    {
                        name: 'category',
                        type: 3,
                        description: 'The category to execute on',
                        required: true,
                        choices: [
                            {
                                name: 'abort',
                                value: 'abort',
                            },
                            {
                                name: 'generic',
                                value: 'generic',
                            },
                            {
                                name: 'http',
                                value: 'http',
                            },
                            {
                                name: 'rateLimit',
                                value: 'rateLimit',
                            },
                        ],
                    },
                    {
                        name: 'type',
                        type: 3,
                        description: 'The category to execute on',
                        required: true,
                        choices: [
                            {
                                name: 'pauseFor',
                                value: 'pauseFor',
                            },
                            {
                                name: 'resumeAfter',
                                value: 'resumeAfter',
                            },
                            {
                                name: 'timeout',
                                value: 'timeout',
                            },
                        ],
                    },
                    {
                        name: 'value',
                        type: 10,
                        description: 'An integer as an input',
                        required: true,
                        min_value: 0,
                    },
                ],
            },
            {
                name: 'call',
                type: 1,
                description: 'Call a function from the API Request Handler',
                options: [
                    {
                        name: 'method',
                        type: 3,
                        description: 'The method to call',
                        required: true,
                        choices: [
                            {
                                name: 'addAbort()',
                                value: 'addAbort',
                            },
                            {
                                name: 'addGeneric()',
                                value: 'addGeneric',
                            },
                            {
                                name: 'addHTTP()',
                                value: 'addHTTP',
                            },
                            {
                                name: 'addRatelimit()',
                                value: 'addRatelimit',
                            },
                        ],
                    },
                    {
                        name: 'value',
                        type: 5,
                        description: 'A value used for isGlobal in addRatelimit()',
                        required: false,
                    },
                ],
            },
        ],
    },
};

type ErrorTypes = 'abort' | 'generic' | 'http' | 'rateLimit';

type TimeoutSettables = 'timeout' | 'resumeAfter';

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const text = RegionLocales.locale(locale).commands.api;
    const { replace } = RegionLocales;

    switch (interaction.options.getSubcommand()) {
        case 'stats': await stats();
            break;
        case 'set': await set();
            break;
        case 'call': await call();
            break;
        // no default
    }

    async function stats() {
        const {
            abort, generic, http, isGlobal, rateLimit, getTimeout,
        } = interaction.client.core.error;
        const { uses } = interaction.client.core.request;
        const { keyPercentage } = interaction.client.config;

        const statsEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setDescription(
                JSON.stringify(
                    interaction.client.core.performance,
                ).slice(0, Constants.limits.embedDescription),
            )
            .addFields(
                {
                    name: text.api.enabled.name,
                    value: replace(text.api.enabled.value, {
                        state: interaction.client.config.core === true
                            ? text.api.yes
                            : text.api.no,
                    }),
                },
                {
                    name: text.api.resume.name,
                    value: replace(text.api.resume.value, {
                        time: cleanLength(getTimeout() - Date.now())
                        ?? 'Not applicable',
                    }),
                },
                {
                    name: text.api.rateLimit.name,
                    value: replace(text.api.rateLimit.value, {
                        state: isGlobal === true
                            ? text.api.yes
                            : text.api.no,
                    }),
                },
                {
                    name: text.api.lastHour.name,
                    value: replace(text.api.lastHour.value, {
                        abort: abort.lastHour,
                        generic: generic.lastHour,
                        http: http.lastHour,
                        rateLimit: rateLimit.lastHour,
                    }),
                },
                {
                    name: text.api.nextTimeouts.name,
                    value: replace(text.api.nextTimeouts.value, {
                        abort: cleanLength(abort.timeout),
                        generic: cleanLength(generic.timeout),
                        http: cleanLength(http.timeout),
                        rateLimit: cleanLength(rateLimit.timeout),
                    }),
                },
                {
                    name: text.api.apiKey.name,
                    value: replace(text.api.apiKey.value, {
                        queries: cleanRound(keyPercentage * keyLimit, 1),
                        percentage: cleanRound(keyPercentage * 100, 1),
                        uses: uses,
                    }),
                },
            );

        await interaction.editReply({
            embeds: [statsEmbed],
        });
    }

    async function set() {
        const category = interaction.options.getString('category', true) as ErrorTypes;
        const type = interaction.options.getString('type', true);
        const value = interaction.options.getNumber('value', true);

        interaction.client.core.error[category][
            type as TimeoutSettables
        ] = value;
        const setEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(text.set.title)
            .setDescription(replace(text.set.description, {
                category: category,
                type: type,
                value: value,
            }));

        Log.interaction(interaction, setEmbed.description);

        await interaction.editReply({
            embeds: [setEmbed],
        });
    }

    async function call() {
        const method = interaction.options.getString('method', true);
        const value = interaction.options.getBoolean('value');

        const hypixelModuleErrors = interaction.client.core.error;

        if (
            method === 'addAbort'
            || method === 'addGeneric'
            || method === 'addHTTP'
        ) {
            hypixelModuleErrors[method]();
        } else if (method === 'addRatelimit') {
            hypixelModuleErrors[method]({
                rateLimitGlobal: value ?? false,
                rateLimitReset: null,
            });
        }

        const callEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(text.call.title)
            .setDescription(replace(text.call.title, {
                method: method,
            }));

        Log.interaction(interaction, callEmbed.description);

        await stats();
        await interaction.followUp({
            embeds: [callEmbed],
            ephemeral: true,
        });
    }
};