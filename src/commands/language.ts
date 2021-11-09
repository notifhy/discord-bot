import type { CommandExecute, CommandProperties } from '../@types/index';
import { ColorResolvable, CommandInteraction, Message } from 'discord.js';
import { BetterEmbed } from '../util/utility';
import { SQLiteWrapper } from '../database';

export const properties: CommandProperties = {
  name: 'language',
  description: 'Set a language for this bot',
  usage: '/language [language]',
  cooldown: 5000,
  ephemeral: true,
  noDM: false,
  ownerOnly: false,
  structure: {
    name: 'language',
    description: 'Set a language for this bot',
    options: [{
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
    }],
  },
};

export const execute: CommandExecute = async (interaction: CommandInteraction, { userData: userData }): Promise<void> => {
  const locales = interaction.client.regionLocales;
  const language = interaction.options.getString('language') as string;

  if (language === userData.language) {
    const alreadySetEmbed = new BetterEmbed({ color: '#FF5555', interaction: interaction, footer: null })
      .setTitle(locales.localizer('commands.language.alreadySet.title', language))
      .setDescription(locales.localizer('commands.language.alreadySet.description', language, {
        language: language,
      }));
    await interaction.editReply({ embeds: [alreadySetEmbed] });
    return;
  }

  await SQLiteWrapper.updateUser({
    discordID: interaction.user.id,
    table: 'users',
    data: {
      language: language,
    },
  });

  const languageEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .setTitle(locales.localizer('commands.language.title', language))
    .setDescription(locales.localizer('commands.language.description', language, {
      language: language,
    }));

	await interaction.editReply({ embeds: [languageEmbed] });
};