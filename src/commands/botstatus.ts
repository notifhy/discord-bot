import type { ClientCommand } from '../@types/client';
import { BetterEmbed } from '../util/utility';
import { Log } from '../util/Log';
import { RegionLocales } from '../../locales/RegionLocales';
import Constants from '../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'botstatus',
    description: 'Set a custom status.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'botstatus',
        description: 'Set a custom for the bot',
        options: [
            {
                name: 'clear',
                type: 1,
                description: 'Clear the custom status',
            },
            {
                name: 'set',
                description: 'Set a custom status',
                type: 1,
                options: [
                    {
                        name: 'string',
                        type: 3,
                        description: 'The status to display',
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
    const text = RegionLocales.locale(locale).commands.botstatus;
    const { replace } = RegionLocales;

    const responseEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal);

    if (interaction.options.getSubcommand() === 'set') {
        const status = interaction.options.getString('string', true);
        interaction.client.customStatus = status;

        interaction.client.user?.setActivity({
            type: 'WATCHING',
            name: status,
        });

        responseEmbed
            .setTitle(text.set.title)
            .setDescription(replace(text.set.description, {
                status: status,
            }));
    } else {
        responseEmbed
            .setTitle(text.cleared.title)
            .setDescription(text.cleared.description);

        interaction.client.customStatus = null;
    }

    Log.command(interaction, responseEmbed.description);

    await interaction.editReply({ embeds: [responseEmbed] });
};