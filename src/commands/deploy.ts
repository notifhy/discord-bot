import type {
    CommandExecute,
    CommandProperties,
    ClientCommand,
} from '../@types/client';
import { BetterEmbed } from '../util/utility';
import { clientID, discordAPIkey as token } from '../../config.json';
import { CommandInteraction } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import fs from 'node:fs/promises';
import Constants from '../util/Constants';

export const properties: CommandProperties = {
    name: 'deploy',
    description: 'Deploy commands',
    usage: '/deploy [global/local] [user/owner]',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    structure: {
        name: 'deploy',
        description: 'Displays helpful information and available commands',
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

export const execute: CommandExecute = async (
    interaction: CommandInteraction,
): Promise<void> => {
    const commandFiles = (await fs.readdir(__dirname)).filter(file =>
        file.endsWith('.ts'),
    );
    const userCommands: object[] = [];
    const ownerCommands: object[] = [];

    for (const file of commandFiles) {
        const {
            properties: { ownerOnly, structure },
        }: ClientCommand = await import(`${__dirname}/${file}`); // eslint-disable-line no-await-in-loop
        if (ownerOnly === false) {
            userCommands.push(structure);
        } else if (ownerOnly === true) {
            ownerCommands.push(structure);
        }
    }

    const scope = interaction.options.getString('scope', true);
    const type = interaction.options.getString('type', true);
    const guildID =
        interaction.options.getString('guild') ?? interaction.guildId!;
    const commands =
        type === 'both'
            ? ownerCommands.concat(userCommands)
            : type === 'none'
            ? []
            : type === 'owner'
            ? ownerCommands
            : userCommands;

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

    const successEmbed = new BetterEmbed({
        color: '#7289DA',
        footer: interaction,
    })
        .setTitle('Success!')
        .setDescription(
            JSON.stringify(commands, null, 2).slice(
                0,
                Constants.limits.embedDescription,
            ) ?? 'None',
        );

    await interaction.editReply({ embeds: [successEmbed] });
};
