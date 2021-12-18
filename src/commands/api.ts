import type { CommandExecute, CommandProperties } from '../@types/client';
import { BetterEmbed, cleanLength, cleanRound } from '../util/utility';
import { CommandInteraction } from 'discord.js';
import { keyLimit } from '../../config.json';
import { HypixelModuleManager } from '../hypixelAPI/HypixelModuleManager';
import { HypixelModuleErrors } from '../hypixelAPI/HypixelModuleErrors';
import Constants from '../util/Constants';

export const properties: CommandProperties = {
    name: 'api',
    description: 'Configure the bot',
    usage: '/api [instance/toggle] <stats/>',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    structure: {
        name: 'api',
        description: 'Toggles dynamic settings',
        options: [
            {
                name: 'stats',
                type: '1',
                description: 'Returns some stats about the API Request Handler',
            },
            {
                name: 'instance',
                type: '1',
                description: 'Modify data held by HypixelModuleInstance',
                options: [
                    {
                        name: 'type',
                        type: '3',
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
                                name: 'maxAborts',
                                value: 'maxAborts',
                            },
                            {
                                name: 'resumeAfter',
                                value: 'resumeAfter',
                            },
                        ],
                    },
                    {
                        name: 'value',
                        type: '10',
                        description: 'An integer as an input',
                        required: true,
                    },
                ],
            },
            {
                name: 'set',
                type: '1',
                description: 'Set data for the API Request Handler',
                options: [
                    {
                        name: 'category',
                        type: '3',
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
                        type: '3',
                        description: 'The category to execute on',
                        required: true,
                        choices: [
                            {
                                name: 'baseTimeout',
                                value: 'baseTimeout',
                            },
                            {
                                name: 'timeout',
                                value: 'timeout',
                            },
                            {
                                name: 'lastMinute',
                                value: 'lastMinute',
                            },
                        ],
                    },
                    {
                        name: 'value',
                        type: '10',
                        description: 'An integer as an input',
                        required: false,
                        min_value: 0,
                    },
                ],
            },
            {
                name: 'call',
                type: '1',
                description: 'Call a function from the API Request Handler',
                options: [
                    {
                        name: 'method',
                        type: '3',
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
                        type: '5',
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

export const execute: CommandExecute = async (
    interaction: CommandInteraction,
): Promise<void> => {
    switch (interaction.options.getSubcommand()) {
        case 'stats':
            await stats(interaction);
            break;
        case 'instance':
            await instance(
                interaction,
                interaction.options.getString('type', true),
                interaction.options.getNumber('value', true),
            );
            break;
        case 'set':
            await set(
                interaction,
                interaction.options.getString('category') as errorTypes,
                interaction.options.getString('type', true),
                interaction.options.getNumber('value', true),
            );
            break;
        case 'call':
            await call(
                interaction,
                interaction.options.getString('method', true),
                interaction.options.getBoolean('value'),
            );
            break;
        //no default
    }
};

async function stats(interaction: CommandInteraction) {
    const { abort, rateLimit, error } = interaction.client.hypixelAPI.errors;
    const { instanceUses, resumeAfter, keyPercentage } =
        interaction.client.hypixelAPI.instance;
    const statsEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .addField(
            'Enabled',
            interaction.client.config.enabled === true ? 'Yes' : 'No',
        )
        .addField(
            'Resuming In',
            cleanLength(resumeAfter - Date.now()) ?? 'Not applicable',
        )
        .addField(
            'Global Rate Limit',
            rateLimit.isGlobal === true ? 'Yes' : 'No',
        )
        .addField(
            'Last Minute Statistics',
            `Aborts: ${abort.lastMinute}
      Rate Limit Hits: ${rateLimit.lastMinute}
      Other Errors: ${error.lastMinute}`,
        )
        .addField(
            'Next Timeout Lengths',
            `May not be accurate
      Abort Errors: ${cleanLength(abort.timeout)}
      Rate Limit Errors: ${cleanLength(rateLimit.timeout)}
      Other Errors: ${cleanLength(error.timeout)}`,
        )
        .addField(
            'API Key',
            `Dedicated Queries: ${cleanRound(
                keyPercentage * keyLimit,
                1,
            )} or ${cleanRound(keyPercentage * 100, 1)}%
      Instance Queries: ${instanceUses}`,
        );

    await interaction.editReply({
        embeds: [statsEmbed],
    });
}

async function instance(
    interaction: CommandInteraction,
    type: string,
    value: number,
) {
    if (type === 'keyPercentage' && value > 1) {
        throw new Error('Too high, must be below 1');
    }

    interaction.client.hypixelAPI.instance[
        type as keyof Omit<HypixelModuleManager['instance'], 'baseURL'>
    ] = value;
    const setEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle('Updated Value!')
        .setDescription(
            `<HypixelModuleManager>.instance.${type} is now ${value}.`,
        );

    await interaction.editReply({
        embeds: [setEmbed],
    });
}

async function set(
    interaction: CommandInteraction,
    category: errorTypes,
    type: string,
    value: number,
) {
    interaction.client.hypixelAPI.errors[category][
        type as keyof HypixelModuleErrors[errorTypes]
    ] = value;
    const setEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle('Updated Value!')
        .setDescription(
            `<HypixelModuleErrors>.${category}.${type} is now ${value}.`,
        );

    await interaction.editReply({
        embeds: [setEmbed],
    });
}

async function call(
    interaction: CommandInteraction,
    type: string,
    value: boolean | null,
) {
    const hypixelModuleErrors = interaction.client.hypixelAPI.errors;
    if (type === 'addAbort' || type === 'addError') {
        hypixelModuleErrors[type]();
    } else if (type === 'addRateLimit') {
        hypixelModuleErrors[type](value ?? false); //value is used for addRateLimit's isGlobal prop
    }
    const callEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle('Executed!')
        .setDescription(`Executed <HypixelModuleErrors>.${type}`);

    await stats(interaction);
    await interaction.followUp({
        embeds: [callEmbed],
        ephemeral: true,
    });
}
