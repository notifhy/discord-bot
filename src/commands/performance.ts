import type { ClientCommand } from '../@types/client';
import { BetterEmbed } from '../util/utility';
import { CommandInteraction } from 'discord.js';
import Constants from '../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'performance',
    description: 'View system performance',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    structure: {
        name: 'performance',
        description: 'View system performance',
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction: CommandInteraction,
): Promise<void> => {
    const {
        fetch: fetchPerformance,
        process: processPerformance,
        modules: modulePerformance,
        total,
    } = interaction.client.hypixel.request.performance.latest!;

    const responseEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle('Performance')
        .addFields([
            {
                name: 'Latest Performance',
                value:
                `Hypixel API Fetch: ${
                    fetchPerformance
                }ms
                Process Data: ${
                    processPerformance
                }ms
                Module Execution: ${
                    modulePerformance
                }ms
                Total: ${total}ms`,
            },
        ]);

    await interaction.editReply({
        embeds: [responseEmbed],
    });
};