import fs from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import { type ClientCommand } from '../@types/client';
import { RegionLocales } from '../locales/RegionLocales';
import { Constants } from '../utility/Constants';
import { Log } from '../utility/Log';
import { SQLite } from '../utility/SQLite';
import { BetterEmbed } from '../utility/utility';

export const properties: ClientCommand['properties'] = {
    name: 'accessdb',
    description: 'Access the database.',
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
    interaction,
    locale,
): Promise<void> => {
    const text = RegionLocales.locale(locale).commands.accessdb;
    const { replace } = RegionLocales;

    const timeout = interaction.options.getInteger('timeout', true);

    const currentAPI = interaction.client.config.core;
    const curentDevMode = interaction.client.config.devMode;

    interaction.client.config.core = false;
    interaction.client.config.devMode = true;

    Log.interaction(interaction, 'Core disabled and Developer Mode enabled');

    await setTimeout(5_000);

    const fileBefore = await fs.readFile(`${__dirname}/../../database.db`);

    SQLite.removeKey();
    SQLite.close();

    const decrypted = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(text.decrypted.title)
        .setDescription(replace(text.decrypted.description, {
            timeout: timeout,
        }));

    await interaction.editReply({
        embeds: [decrypted],
        files: [
            {
                attachment: fileBefore,
                name: 'database.db',
            },
        ],
    });

    await setTimeout(timeout);

    SQLite.open();
    SQLite.rekey();

    interaction.client.config.core = currentAPI;
    interaction.client.config.devMode = curentDevMode;

    Log.interaction(interaction, 'Core and Developer Mode restored');

    const encrypted = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(text.encrypted.title)
        .setDescription(text.encrypted.description);

    const fileAfter = await fs.readFile(`${__dirname}/../../database.db`);

    await interaction.followUp({
        embeds: [encrypted],
        ephemeral: true,
        files: [
            {
                attachment: fileAfter,
                name: 'database.db',
            },
        ],
    });
};