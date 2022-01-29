import type { ClientCommand } from '../@types/client';
import { CommandInteraction } from 'discord.js';
import { setTimeout } from 'node:timers/promises';
import { SQLite } from '../util/SQLite';
import { BetterEmbed } from '../util/utility';
import Constants from '../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'accessdb',
    description: 'Access the database',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'accessdb',
        description: 'Access the database',
        options: [
            {
                name: 'timeout',
                type: 4,
                description: 'Timeout in milliseconds',
                required: true,
            },
        ],
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction: CommandInteraction,
): Promise<void> => {
    const timeout = interaction.options.getInteger('timeout', true);

    const currentAPI = interaction.client.config.enabled;
    const curentDevMode = interaction.client.config.devMode;
    interaction.client.config.enabled = false;
    interaction.client.config.devMode = true;

    await setTimeout(5000);

    SQLite.fullDecrypt();
    SQLite.close();

    const decrypted = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle('Decrypted')
        .setDescription(`Database decrypted, encrypting in ${timeout}.`);

    await interaction.editReply({ embeds: [decrypted] });

    await setTimeout(timeout);

    SQLite.open();
    SQLite.encrypt();

    interaction.client.config.enabled = currentAPI;
    interaction.client.config.enabled = curentDevMode;

    const encrypted = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle('Encrypted')
        .setDescription('Database encrypted.');

    await interaction.followUp({
        embeds: [encrypted],
        ephemeral: true,
    });
};