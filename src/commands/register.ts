import type { CommandExecute, CommandProperties } from '../@types/client';
import { BetterEmbed } from '../util/utility';
import { CommandInteraction } from 'discord.js';
import { FriendsModule, RawFriendsModule, RawRewardsModule, RawUserAPIData, RewardsModule, UserAPIData } from '../@types/database';
import { Request } from '../util/Request';
import type { Slothpixel } from '../@types/hypixel';
import { SQLiteWrapper } from '../database';
import Constants from '../util/Constants';
import HTTPError from '../util/error/HTTPError';

export const properties: CommandProperties = {
  name: 'register',
  description: 'Register and setup your profile',
  usage: '/register [username/uuid]',
  cooldown: 15_000,
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
  const locale = interaction.client.regionLocales.locale(userData.language).commands.register;
  const { replace } = interaction.client.regionLocales;
  const inputUUID = /^[0-9a-f]{8}(-?)[0-9a-f]{4}(-?)[1-5][0-9a-f]{3}(-?)[89AB][0-9a-f]{3}(-?)[0-9a-f]{12}$/i;
  const inputUsername = /^[a-zA-Z0-9_-]{1,24}$/g;
  const input: string = interaction.options.getString('player') as string;
  const inputType = inputUUID.test(input) === true ? 'UUID' : 'username';

  if (inputUUID.test(input) === false && inputUsername.test(input) === false) {
    const invalidEmbed = new BetterEmbed({ color: '#FF5555', footer: interaction })
      .setTitle(locale.invalid.title)
      .setDescription(locale.invalid.description);
    await interaction.editReply({ embeds: [invalidEmbed] });
    return;
  }

  const response = await new Request({}).request(`https://api.slothpixel.me/api/players/${input}`);

  if (response.status === 404) {
    const notFoundEmbed = new BetterEmbed({ color: '#FF5555', footer: interaction })
      .setTitle(locale.notFound.title)
      .setDescription(replace(locale.notFound.description, {
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
    rewards: {
      streak_current,
      streak_best,
      claimed_daily,
      claimed,
    },
    links: {
      DISCORD,
    },
  } = await response.json() as Slothpixel;

  if (DISCORD === null) {
    const unlinkedEmbed = new BetterEmbed({ color: '#FF5555', footer: interaction })
      .setTitle(locale.unlinked.title)
      .setDescription(locale.unlinked.description)
      .setImage('https://i.imgur.com/gGKd2s8.gif');
    await interaction.editReply({ embeds: [unlinkedEmbed] });
    return;
  }

  if (DISCORD !== interaction.user.tag && DISCORD === 'o') {
    const mismatchedEmbed = new BetterEmbed({ color: '#FF5555', footer: interaction })
      .setTitle(locale.mismatched.title)
      .setDescription(locale.mismatched.description)
      .setImage('https://i.imgur.com/gGKd2s8.gif');
    await interaction.editReply({ embeds: [mismatchedEmbed] });
    return;
  }

  await Promise.all([
    SQLiteWrapper.newUser<UserAPIData, RawUserAPIData>({
      table: 'api',
      data: {
        discordID: interaction.user.id,
        uuid: uuid,
        modules: [],
        lastUpdated: Date.now(),
        firstLogin: first_login,
        lastLogin: last_login,
        lastLogout: last_logout,
        version: mc_version,
        language: language,
        gameType: null,
        lastClaimedReward: null,
        rewardScore: streak_current,
        rewardHighScore: streak_best,
        totalDailyRewards: claimed_daily,
        totalRewards: claimed,
        history: [],
      },
    }),
    SQLiteWrapper.newUser<FriendsModule, RawFriendsModule>({
      table: 'friends',
      data: {
        discordID: interaction.user.id,
        channel: null,
        suppressNext: false,
      },
    }),
    SQLiteWrapper.newUser<RewardsModule, RawRewardsModule>({
      table: 'rewards',
      data: {
        discordID: interaction.user.id,
        alertTime: null,
        lastNotified: 0,
        milestones: true,
        notificationInterval: null,
      },
    }),
  ]);

  const registerEmbed = new BetterEmbed({ color: Constants.color.normal, footer: interaction })
    .setTitle(locale.title)
    .setDescription(locale.description)
    .addField(locale.field.name,
      locale.field.value);

  await interaction.editReply({ embeds: [registerEmbed] });
};