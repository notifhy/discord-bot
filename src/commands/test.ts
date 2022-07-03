import {
    CommandInteraction,
    MessageActionRow,
    MessageButton,
} from 'discord.js';
import { type ClientCommand } from '../@types/client';

export const properties: ClientCommand['properties'] = {
    name: 'test',
    description: 'Does stuff.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'test',
        description: 'Does stuff',
        options: [
            {
                name: 'delete',
                type: 2,
                description: 'Delete all of your data',
                options: [
                    {
                        name: 'view',
                        description: 'Returns a file with all of your data',
                        type: 1,
                        options: [
                            {
                                name: 'command',
                                type: 3,
                                description:
                                    'A command to get info about. This parameter is completely optional',
                                required: false,
                            },
                        ],
                    },
                ],
            },
        ],
    },
};

/* eslint-disable no-await-in-loop */

export const execute: ClientCommand['execute'] = async (
    interaction: CommandInteraction,
): Promise<void> => {
    const channel = (
        await (
            await interaction.client.users.fetch(interaction.user.id)
        ).createDM()
    ).id;

    const button = new MessageButton()
        .setStyle('LINK')
        .setLabel('aaaa')
        .setURL(`discord://-/channels/@me/${channel}`);

    await interaction.followUp({ content: 'e', components: [new MessageActionRow().setComponents(button)] });
};