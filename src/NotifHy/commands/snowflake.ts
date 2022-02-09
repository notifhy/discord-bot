import type { ClientCommand } from '../@types/client';
import { BetterEmbed, timestamp } from '../../util/utility';
import { RegionLocales } from '../../../locales/RegionLocales';
import { SnowflakeUtil } from 'discord.js';
import Constants from '../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'snowflake',
    description: 'Deconstruct a snowflake.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'snowflake',
        description: 'Deconstruct a snowflake',
        options: [
            {
                name: 'snowflake',
                type: 3,
                description: 'Discord Snowflake',
                required: true,
            },
        ],
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const text = RegionLocales.locale(locale).commands.snowflake;
    const { replace } = RegionLocales;

    const snowflake = interaction.options.getString('snowflake', true);

    const {
        timestamp: time,
        workerId,
        processId,
        increment,
    } = SnowflakeUtil.deconstruct(snowflake);

    const snowflakeEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(text.title)
        .addFields(
            {
                name: text.input.name,
                value: replace(text.input.value, {
                    input: snowflake,
                }),
            },
            {
                name: text.length.name,
                value: replace(text.length.value, {
                    length: String(snowflake.length),
                }),
            },
            {
                name: text.date.name,
                value: replace(text.date.value, {
                    date: String(timestamp(time, 'D')),
                    time: String(timestamp(time, 'T')),
                    relative: String(timestamp(time, 'R')),
                }),
            },
            {
                name: text.worker.name,
                value: replace(text.worker.value, {
                    worker: String(workerId),
                }),
            },
            {
                name: text.process.name,
                value: replace(text.process.value, {
                    process: String(processId),
                }),
            },
            {
                name: text.increment.name,
                value: replace(text.increment.value, {
                    increment: String(increment),
                }),
            },
        );

    await interaction.editReply({ embeds: [snowflakeEmbed] });
};