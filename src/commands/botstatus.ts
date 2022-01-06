import type { ClientCommand } from '../@types/client';
import { BetterEmbed } from '../util/utility';
import { CommandInteraction } from 'discord.js';
import { Log } from '../util/Log';
import Constants from '../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'botstatus',
    description: 'Set a custom status',
    usage: '/botstatus [set/clear] <string>',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
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
    interaction: CommandInteraction,
): Promise<void> => {
    const responseEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal);

    if (interaction.options.getSubcommand() === 'set') {
        const status = interaction.options.getString('string', true);
        interaction.client.customStatus = status;

        interaction.client.user?.setActivity({
            type: 'WATCHING',
            name: status,
        });

        responseEmbed.setTitle('Status Set');
        responseEmbed.setDescription(`The status is now set to ${status}!`);
    } else {
        responseEmbed.setTitle('Status Cleared');
        responseEmbed.setDescription('The status is now automatic!');
        interaction.client.customStatus = null;
    }

    Log.command(interaction, responseEmbed.description);

    await interaction.editReply({ embeds: [responseEmbed] });
};
