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
    const { instance } = interaction.client.hypixelAPI;

    const {
        fetch: fetchPerformance,
        databaseFetch: databaseFetchPerformance,
        process: processPerformance,
        save: savePerformance,
        modules: modulePerformance,
        total,
    } = instance.performance.latest!;

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
                Database Fetch: ${
                    databaseFetchPerformance
                }ms
                Process Data: ${
                    processPerformance
                }ms
                Save Data: ${
                    savePerformance
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
