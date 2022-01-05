import type {
    CommandExecute,
    CommandProperties,
} from '../@types/client';
import type { UserData } from '../@types/database';
import { BetterEmbed } from '../util/utility';
import { CommandInteraction } from 'discord.js';
import { Log } from '../util/Log';
import { RegionLocales } from '../../locales/localesHandler';
import { SQLite } from '../util/SQLite';
import Constants from '../util/Constants';

export const properties: CommandProperties = {
    name: 'language',
    description: 'Set a language for this bot',
    usage: '/language [language]',
    cooldown: 10_000,
    ephemeral: true,
    noDM: false,
    ownerOnly: false,
    structure: {
        name: 'language',
        description: 'Set a language for this bot',
        options: [
            {
                name: 'language',
                type: '3',
                description: 'The language to use for this bot',
                required: true,
                choices: [
                    {
                        name: 'en-us • English',
                        value: 'en-us',
                    },
                    {
                        name: 'fr-FR • Français',
                        value: 'fr-FR',
                    },
                ],
            },
        ],
    },
};

export const execute: CommandExecute = async (
    interaction: CommandInteraction,
    { userData },
): Promise<void> => {
    const language = interaction.options.getString('language', true);
    const locale = RegionLocales.locale(language).commands.language;
    const replace = RegionLocales.replace;

    if (language === userData.language) {
        const alreadySetEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle(locale.alreadySet.title)
            .setDescription(
                replace(locale.alreadySet.description, {
                    language: language,
                }),
            );

        Log.command(interaction, `Language already set: ${language}`);

        await interaction.editReply({ embeds: [alreadySetEmbed] });
        return;
    }

    await SQLite.updateUser<UserData>({
        discordID: interaction.user.id,
        table: Constants.tables.users,
        data: {
            language: language,
        },
    });

    const languageEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(locale.title)
        .setDescription(
            replace(locale.description, {
                language: language,
            }),
        );

    Log.command(interaction, `Language set to ${language}`);

    await interaction.editReply({ embeds: [languageEmbed] });
};
