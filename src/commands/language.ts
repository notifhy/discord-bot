import type { ClientCommand } from '../@types/client';
import type { UserData } from '../@types/database';
import { BetterEmbed } from '../util/utility';
import { Log } from '../util/Log';
import { RegionLocales } from '../../locales/RegionLocales';
import { SQLite } from '../util/SQLite';
import Constants from '../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'language',
    description: 'Override the language for this bot. By default, the language used is automatic',
    cooldown: 10_000,
    ephemeral: true,
    noDM: false,
    ownerOnly: false,
    structure: {
        name: 'language',
        description: 'Override the language for this bot',
        options: [
            {
                name: 'language',
                type: 3,
                description: 'The language to use for the override',
                required: true,
                choices: [
                    {
                        name: 'Reset Override',
                        value: 'Auto',
                    },
                    {
                        name: 'English (English)',
                        value: 'en-US',
                    },
                    {
                        name: 'Français (French)',
                        value: 'fr',
                    },
                ],
            },
        ],
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const userData =
        await SQLite.getUser<UserData>({
            discordID: interaction.user.id,
            table: Constants.tables.users,
            columns: ['localeOverride'],
            allowUndefined: false,
        });

    const rawNewLocale = interaction.options.getString('language', true);
    const newLocale = rawNewLocale === 'Auto'
        ? null
        : rawNewLocale;

    const text = RegionLocales.locale(newLocale ?? locale).commands.language;
    const replace = RegionLocales.replace;

    if (newLocale === userData.localeOverride) {
        const alreadySetEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle(text.alreadySet.title)
            .setDescription(
                replace(text.alreadySet.description, {
                    locale: rawNewLocale,
                }),
            );

        Log.command(interaction, `Locale already set: ${rawNewLocale}`);

        await interaction.editReply({ embeds: [alreadySetEmbed] });
        return;
    }

    await SQLite.updateUser<UserData>({
        discordID: interaction.user.id,
        table: Constants.tables.users,
        data: {
            localeOverride: newLocale,
        },
    });

    const languageEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(text.title)
        .setDescription(
            replace(text.description, {
                locale: rawNewLocale,
            }),
        );

    Log.command(interaction, `Locale set to ${rawNewLocale}`);

    await interaction.editReply({ embeds: [languageEmbed] });
};
