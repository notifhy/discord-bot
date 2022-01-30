import type { ClientCommand } from '../@types/client';
import { BetterEmbed, timestamp } from '../util/utility';
import { RegionLocales } from '../../locales/RegionLocales';
import { SnowflakeUtil } from 'discord.js';
import Constants from '../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'snowflake',
    description: 'Deconstruct a snowflake',
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
        .addField(text.input.name, replace(text.input.value, {
            snowflake: snowflake,
        }))
        .addField(text.length.name, replace(text.length.value, {
            length: String(snowflake.length),
        }))
        .addField(text.date.name, replace(text.date.value, {
            date: String(timestamp(time, 'D')),
            time: String(timestamp(time, 'T')),
            relative: String(timestamp(time, 'R')),
        }))
        .addField(text.worker.name, replace(text.worker.value, {
            worker: String(workerId),
        }))
        .addField(text.process.name, replace(text.process.value, {
            process: String(processId),
        }))
        .addField(text.increment.name, replace(text.increment.value, {
            increment: String(increment),
        }));

    await interaction.editReply({ embeds: [snowflakeEmbed] });
};