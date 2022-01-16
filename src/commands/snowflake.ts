import type { ClientCommand } from '../@types/client';
import { BetterEmbed, timestamp } from '../util/utility';
import { CommandInteraction, SnowflakeUtil } from 'discord.js';
import Constants from '../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'snowflake',
    description: 'Deconstruct a snowflake',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
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
    interaction: CommandInteraction,
): Promise<void> => {
    const snowflake = interaction.options.getString('snowflake', true);

    const {
        timestamp: time,
        workerId,
        processId,
        increment,
    } = SnowflakeUtil.deconstruct(snowflake);

    const snowflakeEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .addField('Input', snowflake)
        .addField('Length', String(snowflake.length))
        .setTitle('Snowflake')
        .addField('Date',
        `Date: ${String(timestamp(time, 'D'))}
        Time: ${String(timestamp(time, 'T'))}
        Relative: ${String(timestamp(time, 'R'))}`)
        .addField('Worker ID', String(workerId))
        .addField('Process ID', String(processId))
        .addField('Increment', String(increment));

    await interaction.editReply({ embeds: [snowflakeEmbed] });
};