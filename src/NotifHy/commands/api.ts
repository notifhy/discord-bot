import type { ClientCommand } from '../@types/client';
import {
    BetterEmbed,
    cleanLength,
    cleanRound,
} from '../../utility/utility';
import { Constants } from '../utility/Constants';
import { keyLimit } from '../../../config.json';
import { Log } from '../../utility/Log';
import { RegionLocales } from '../locales/RegionLocales';
import { RequestManager } from '../hypixel/RequestManager';

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
                name: 'instance',
                type: 1,
                description: 'Modify data held by RequestInstance',
                options: [
                    {
                        name: 'type',
                        type: 3,
                        description: 'The type to execute on',
                        required: true,
                        choices: [
                            {
                                name: 'abortThreshold',
                                value: 'abortThreshold',
                            },
                            {
                                name: 'keyPercentage',
                                value: 'keyPercentage',
                            },
                            {
                                name: 'maxRetries',
                                value: 'maxRetries',
                            },
                        ],
                    },
                    {
                        name: 'value',
                        type: 10,
                        description: 'An integer as an input',
                        required: true,
                    },
                ],
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
                                name: 'rateLimit',
                                value: 'rateLimit',
                            },
                            {
                                name: 'error',
                                value: 'error',
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
                                name: 'addRateLimit()',
                                value: 'addRateLimit',
                            },
                            {
                                name: 'addError()',
                                value: 'addError',
                            },
                        ],
                    },
                    {
                        name: 'value',
                        type: 5,
                        description:
                            'A value used for isGlobal in addRateLimit()',
                        required: false,
                    },
                ],
            },
        ],
    },
};

type errorTypes = 'abort' | 'rateLimit' | 'error';

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
        case 'instance': await instance();
        break;
        case 'set': await set();
        break;
        case 'call': await call();
        break;
        //no default
    }

    async function stats() {
        const { abort, isGlobal, rateLimit, error, getTimeout } =
            interaction.client.hypixel.errors;
        const { uses, keyPercentage } =
            interaction.client.hypixel.request;

        const statsEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setDescription(
                JSON.stringify(
                    interaction.client.hypixel.request.performance,
                ).slice(0, Constants.limits.embedDescription),
            )
            .addFields(
                {
                    name: text.api.enabled.name,
                    value: replace(text.api.enabled.value, {
                        state: interaction.client.config.enabled === true
                            ? text.api.yes
                            : text.api.no,
                    }),
                },
                {
                    name: text.api.resume.name,
                    value: replace(text.api.resume.value, {
                        time: cleanLength(getTimeout() - Date.now()) ??
                        'Not applicable',
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
                    name: text.api.lastMinute.name,
                    value: replace(text.api.lastMinute.value, {
                        abort: abort.lastMinute,
                        rateLimit: rateLimit.lastMinute,
                        error: error.lastMinute,
                    }),
                },
                {
                    name: text.api.nextTimeouts.name,
                    value: replace(text.api.nextTimeouts.value, {
                        abort: abort.timeout,
                        rateLimit: rateLimit.timeout,
                        error: error.timeout,
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

    async function instance() {
        const type = interaction.options.getString('type', true);
        const value = interaction.options.getNumber('value', true);

        if (type === 'keyPercentage' && value > 1) {
            throw new Error(text.instance.tooHigh);
        }

        interaction.client.hypixel.request[
            type as keyof Omit<RequestManager, 'baseURL' | 'getURLs' | 'hypixelRequest' | 'performance' | 'request'>
        ] = value;

        const setEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(text.instance.title)
            .setDescription(replace(text.instance.description, {
                type: type,
                value: value,
            }));

        Log.command(interaction, setEmbed.description);

        await interaction.editReply({
            embeds: [setEmbed],
        });
    }

    async function set() {
        const category = interaction.options.getString('category', true) as errorTypes;
        const type = interaction.options.getString('type', true);
        const value = interaction.options.getNumber('value', true);

        interaction.client.hypixel.errors[category][
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

        Log.command(interaction, setEmbed.description);

        await interaction.editReply({
            embeds: [setEmbed],
        });
    }

    async function call() {
        const method = interaction.options.getString('method', true);
        const value = interaction.options.getBoolean('value');

        const hypixelModuleErrors = interaction.client.hypixel.errors;

        if (method === 'addAbort' || method === 'addError') {
            hypixelModuleErrors[method]();
        } else if (method === 'addRateLimit') {
            hypixelModuleErrors[method]({
                rateLimitGlobal: value ?? false,
                ratelimitReset: null,
            });
        }

        const callEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(text.call.title)
            .setDescription(replace(text.call.title, {
                method: method,
            }));

        Log.command(interaction, callEmbed.description);

        await stats();
        await interaction.followUp({
            embeds: [callEmbed],
            ephemeral: true,
        });
    }
};