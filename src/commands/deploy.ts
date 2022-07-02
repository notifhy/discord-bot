import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import fs from 'node:fs/promises';
import type { ClientCommand } from '../@types/client';
import {
    clientID,
    discordAPIkey as token,
} from '../../config.json';
import { Constants } from '../utility/Constants';
import { RegionLocales } from '../locales/RegionLocales';
import { Log } from '../utility/Log';
import { BetterEmbed } from '../utility/utility';

export const properties: ClientCommand['properties'] = {
    name: 'deploy',
    description: 'Deploy commands.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'deploy',
        description: 'Deploy commands',
        options: [
            {
                name: 'scope',
                description: 'Global or Guild',
                type: 3,
                required: true,
                choices: [
                    {
                        name: 'Global',
                        value: 'global',
                    },
                    {
                        name: 'Guild',
                        value: 'guild',
                    },
                ],
            },
            {
                name: 'type',
                description: 'User or Owner commands',
                type: 3,
                required: true,
                choices: [
                    {
                        name: 'User',
                        value: 'user',
                    },
                    {
                        name: 'Owner',
                        value: 'owner',
                    },
                    {
                        name: 'Both',
                        value: 'both',
                    },
                    {
                        name: 'None',
                        value: 'none',
                    },
                ],
            },
            {
                name: 'guild',
                description: 'Guild ID',
                type: 3,
                required: false,
            },
        ],
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const text = RegionLocales.locale(locale).commands.deploy;

    const commandFiles = (await fs.readdir(__dirname)).filter((file) => file.endsWith('.ts'));
    const userCommands: object[] = [];
    const ownerCommands: object[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const file of commandFiles) {
        const {
            properties: { ownerOnly, structure },
        }: ClientCommand = await import(`${__dirname}/${file}`); // eslint-disable-line no-await-in-loop

        if (ownerOnly === false) {
            userCommands.push(structure);
        } else {
            ownerCommands.push(structure);
        }
    }

    const scope = interaction.options.getString('scope', true);
    const type = interaction.options.getString('type', true);
    const guildID = interaction.options.getString('guild')
        ?? interaction.guildId!;

    let commands: object[];

    if (type === 'both') {
        commands = ownerCommands.concat(userCommands);
    } else if (type === 'none') {
        commands = [];
    } else if (type === 'owner') {
        commands = ownerCommands;
    } else {
        commands = userCommands;
    }

    const rest = new REST({ version: '9' }).setToken(token);

    if (scope === 'global') {
        await rest.put(Routes.applicationCommands(clientID), {
            body: commands,
        });
    } else {
        await rest.put(Routes.applicationGuildCommands(clientID, guildID), {
            body: commands,
        });
    }

    const successEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(text.title)
        .setDescription(
            JSON.stringify(commands).slice(
                0,
                Constants.limits.embedDescription,
            ) ?? text.none,
        );

    Log.interaction(interaction, `Scope: ${scope} | Type: ${type} | Guild ID: ${guildID}`);

    await interaction.editReply({ embeds: [successEmbed] });
};