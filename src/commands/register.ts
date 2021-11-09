import type { CommandExecute, CommandProperties } from '../@types/index';
import { ColorResolvable, CommandInteraction, Message } from 'discord.js';
import { BetterEmbed } from '../util/utility';
import { Request } from '../hypixelAPI/Request';
import { HTTPError } from '../util/error/HTTPError';
import { Slothpixel } from '../@types/hypixel';
import { SQLiteWrapper } from '../database';

export const properties: CommandProperties = {
  name: 'register',
  description: 'Register and setup your profile',
  usage: '/register [username/uuid]',
  cooldown: 15000,
  ephemeral: true,
  noDM: false,
  ownerOnly: false,
  structure: {
    name: 'register',
    description: 'Register to begin using the modules this bot offers',
    options: [{
      name: 'player',
      type: '3',
      description: 'Your username or UUID',
      required: true,
  }],
  },
};

export const execute: CommandExecute = async (interaction: CommandInteraction, { userData }): Promise<void> => {
  const locales = interaction.client.regionLocales;
  const inputUUID = /^[0-9a-f]{8}(-?)[0-9a-f]{4}(-?)[1-5][0-9a-f]{3}(-?)[89AB][0-9a-f]{3}(-?)[0-9a-f]{12}$/i;
  const inputUsername = /^[a-zA-Z0-9_-]{1,24}$/g;
  const input: string = interaction.options.getString('player') as string;
  const inputType = inputUUID.test(input) === true ? 'UUID' : 'username';

  if (inputUUID.test(input) === false && inputUsername.test(input) === false) {
    const invalidEmbed = new BetterEmbed({ color: '#FF5555', interaction: interaction, footer: null })
      .setTitle(locales.localizer('commands.register.invalid.title', userData.language))
      .setDescription(locales.localizer('commands.register.invalid.description', userData.language));
    await interaction.editReply({ embeds: [invalidEmbed] });
    return;
  }

  const response = await new Request({}).request(`https://api.slothpixel.me/api/players/${input}`);

  if (response.status === 404) {
    const notFoundEmbed = new BetterEmbed({ color: '#FF5555', interaction: interaction, footer: null })
      .setTitle(locales.localizer('commands.register.notFound.title', userData.language))
      .setDescription(locales.localizer('commands.register.notFound.description', userData.language, {
        inputType: inputType,
      }));
    await interaction.editReply({ embeds: [notFoundEmbed] });
    return;
  }

  if (response.ok === false) throw new HTTPError({ response: response });

  const {
    uuid,
    first_login,
    last_login,
    last_logout,
    mc_version,
    language,
    last_game,
    rewards: {
      streak_current,
      streak_best,
      claimed_daily,
      claimed,
    },
    links: {
      DISCORD,
    } } = await response.json() as Slothpixel;

  if (DISCORD === null) {
    const unlinkedEmbed = new BetterEmbed({ color: '#FF5555', interaction: interaction, footer: null })
      .setTitle(locales.localizer('commands.register.unlinked.title', userData.language))
      .setDescription(locales.localizer('commands.register.unlinked.description', userData.language))
      .setImage('https://i.imgur.com/gGKd2s8.gif');
    await interaction.editReply({ embeds: [unlinkedEmbed] });
    return;
  }

  if (DISCORD !== interaction.user.tag) {
    const mismatchedEmbed = new BetterEmbed({ color: '#FF5555', interaction: interaction, footer: null })
      .setTitle(locales.localizer('commands.register.mismatched.title', userData.language))
      .setDescription(locales.localizer('commands.register.mismatched.description', userData.language))
      .setImage('https://i.imgur.com/gGKd2s8.gif');
    await interaction.editReply({ embeds: [mismatchedEmbed] });
    return;
  }

  await SQLiteWrapper.newUser({
    table: 'api',
    data: {
      discordID: interaction.user.id,
      uuid: uuid,
      modules: null,
      lastUpdated: Date.now(),
      firstLogin: first_login,
      lastLogin: last_login,
      lastLogout: last_logout,
      version: mc_version,
      language: language,
      mostRecentGameType: null,
      lastClaimedReward: null,
      rewardScore: streak_current,
      rewardHighScore: streak_best,
      totalDailyRewards: claimed_daily,
      totalRewards: claimed,
      defenderHistory: JSON.stringify([]),
      friendHistory: JSON.stringify([]),
      dailyHistory: JSON.stringify([]),
    },
  });

  const registerEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .setTitle(locales.localizer('commands.register.title', userData.language))
    .setDescription(locales.localizer('commands.register.description', userData.language))
    .addField(locales.localizer('commands.register.field.name', userData.language),
      locales.localizer('commands.register.field.value', userData.language));

	await interaction.editReply({ embeds: [registerEmbed] });
};