import type { ClientCommand } from '../@types/client';
import { CommandInteraction } from 'discord.js';
import { setTimeout } from 'node:timers/promises';
import { SQLite } from '../util/SQLite';

export const properties: ClientCommand['properties'] = {
    name: 'accessdb',
    description: 'Does stuff',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'accessdb',
        description: 'access db',
        options: [
            {
                name: 'timeout',
                type: 4,
                description: 'timeout in ms',
                required: true,
            },
            {
                name: 'force',
                type: 5,
                description: 'ignore warnings',
                required: false,
            },
        ],
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction: CommandInteraction,
): Promise<void> => {
    const force = interaction.options.getBoolean('force') ?? false;

    if (
        interaction.client.config.enabled === true &&
        force === false
    ) {
        await interaction.editReply({
            content: 'You must disable the API first',
        });

        return;
    }

    const timeout = interaction.options.getInteger('timeout', true);

    SQLite.fullDecrypt();
    SQLite.close();

    await interaction.editReply({
        content: `Database decrypted, encrypting in ${timeout}`,
    });

    await setTimeout(timeout);

    SQLite.open();
    SQLite.encrypt();
    await interaction.followUp({
        content: 'Database encrypted',
        ephemeral: true,
    });
};