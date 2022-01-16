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
    requireRegistration: false,
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
): Promise<void> => {
    const userData =
        await SQLite.getUser<UserData>({
            discordID: interaction.user.id,
            table: Constants.tables.users,
            columns: ['localeOverride'],
            allowUndefined: false,
        });

    const newLocale = interaction.options.getString('language', true);
    const rawNewLocale = newLocale === 'Auto' ? interaction.locale : newLocale;

    const text = RegionLocales.locale(rawNewLocale).commands.language;
    const replace = RegionLocales.replace;

    if (
        newLocale === 'Auto' &&
        userData.localeOverride === false
    ) {
        const alreadyRemovedEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle(text.alreadyRemoved.title)
            .setDescription(text.alreadyRemoved.description);

        Log.command(interaction, 'Locale already set to auto');

        await interaction.editReply({ embeds: [alreadyRemovedEmbed] });

        return;
    }

    await SQLite.updateUser<UserData>({
        discordID: interaction.user.id,
        table: Constants.tables.users,
        data: {
            locale: rawNewLocale,
            localeOverride: newLocale !== 'Auto',
        },
    });

    const languageEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal);

    if (newLocale === 'Auto') {
        languageEmbed
            .setTitle(text.reset.title)
            .setDescription(text.reset.description);

        Log.command(interaction, 'Locale reset');
    } else {
        languageEmbed
            .setTitle(text.set.title)
            .setDescription(
                replace(text.set.description, {
                    locale: newLocale,
                }),
            );

        Log.command(interaction, `Locale set to ${newLocale}`);
    }

    await interaction.editReply({ embeds: [languageEmbed] });
};