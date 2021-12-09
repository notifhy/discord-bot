import type { CommandExecute, CommandProperties } from '../@types/client';
import { BetterEmbed } from '../util/utility';
import { CommandInteraction } from 'discord.js';
import type { RawUserAPIData, UserAPIData } from '../@types/database';
import { RegionLocales } from '../../locales/localesHandler';
import { SQLiteWrapper } from '../database';
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
    const { replace } = RegionLocales;

    if (language === userData.language) {
        const alreadySetEmbed = new BetterEmbed({
            color: '#FF5555',
            footer: interaction,
        })
            .setTitle(locale.alreadySet.title)
            .setDescription(
                replace(locale.alreadySet.description, {
                    language: language,
                }),
            );
        await interaction.editReply({ embeds: [alreadySetEmbed] });
        return;
    }

    await SQLiteWrapper.updateUser<Partial<UserAPIData>, RawUserAPIData>({
        discordID: interaction.user.id,
        table: Constants.tables.users,
        data: {
            language: language,
        },
    });

    const languageEmbed = new BetterEmbed({
        color: '#7289DA',
        footer: interaction,
    })
        .setTitle(locale.title)
        .setDescription(
            replace(locale.description, {
                language: language,
            }),
        );

    await interaction.editReply({ embeds: [languageEmbed] });
};
