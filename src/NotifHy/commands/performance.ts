import type { ClientCommand } from '../../@types/client';
import { BetterEmbed } from '../../util/utility';
import { RegionLocales } from '../../../locales/RegionLocales';
import Constants from '../../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'performance',
    description: 'View system performance.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'performance',
        description: 'View system performance',
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const text = RegionLocales.locale(locale).commands.performance;
    const { replace } = RegionLocales;

    const {
        fetch: fetchPerformance,
        process: processPerformance,
        modules: modulePerformance,
        total,
    } = interaction.client.hypixel.request.performance.latest!;

    const responseEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(text.title)
        .addField(
            text.latest.name,
            replace(text.latest.value, {
                fetchPerformance: fetchPerformance,
                processPerformance: processPerformance,
                modulePerformance: modulePerformance,
                total: total,
            }),
        );

    await interaction.editReply({
        embeds: [responseEmbed],
    });
};