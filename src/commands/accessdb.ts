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
            {
                name: 'force',
                type: 5,
                description: 'Ignore API check',
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
        const embed = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle('API')
            .setDescription('You must disabled the API first.');

        await interaction.editReply({ embeds: [embed] });

        return;
    }

    const timeout = interaction.options.getInteger('timeout', true);

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

    const encrypted = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle('Encrypted')
        .setDescription('Database encrypted.');

    await interaction.followUp({
        embeds: [encrypted],
        ephemeral: true,
    });
};