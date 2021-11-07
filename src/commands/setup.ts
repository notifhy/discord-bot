import type { CommandProperties } from '../@types/index';
import { ColorResolvable, CommandInteraction, Message } from 'discord.js';
import { BetterEmbed } from '../util/utility';
import { Request } from '../hypixelAPI/Request';
import { HTTPError } from '../util/error/HTTPError';
import { Slothpixel } from '../@types/hypixel';
import { SQLiteWrapper } from '../database';

export const properties: CommandProperties = {
  name: 'setup',
  description: 'Register and setup your profile',
  usage: '/setup [username/uuid]',
  cooldown: 15000,
  ephemeral: true,
  noDM: false,
  ownerOnly: false,
  structure: {
    name: 'register',
    description: 'Register to begin using the modules this bot offers',
    options: [{
      name: 'player',
      type: 'STRING',
      description: 'Your username or UUID',
      required: true,
  }],
  },
};

export const execute = async (interaction: CommandInteraction): Promise<void> => {
  const locales = interaction.client.regionLocales;
  const registerEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null });
  const inputUUID = /^[0-9a-f]{8}(-?)[0-9a-f]{4}(-?)[1-5][0-9a-f]{3}(-?)[89AB][0-9a-f]{3}(-?)[0-9a-f]{12}$/i;
  const inputUsername = /^[a-zA-Z0-9_-]{1,24}$/g;
  const input: string = interaction.options.getString('player') as string;
  const inputType = inputUUID.test(input) === true ? 'UUID' : 'username';

  if (inputUUID.test(input) === false && inputUsername.test(input) === false) {
    registerEmbed
      .setTitle('InValid Input')
      .setDescription(`The username/UUID provided is invalid! The username cannot contain invalid characters. UUIDs must match the following regex: \`/^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89AB][0-9a-f]{3}[0-9a-f]{12}$/i\`. You can test this regex with [__this__](https://regex101.com/r/A866mm/1) site.`);
  }

  const response = await new Request({}).request(`https://api.slothpixel.me/api/players/${input}`);

  if (response.status === 404) {
    registerEmbed
      .setTitle('Not Found')
      .setDescription(`That ${inputType} doesn't seem to be valid. Check to see if you spelt it wrong.`)
      .setImage('https://i.imgur.com/gGKd2s8.gif');
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
      claimed,
      claimed_daily,
    },
    links: {
      DISCORD,
    } } = await response.json() as Slothpixel;

  if (DISCORD === null) {
    registerEmbed
      .setTitle('Unlinked Account')
      .setDescription('You have not linked your Discord account to your Minecraft account on Hypixel! Follow the guide below:')
      .setImage('https://i.imgur.com/gGKd2s8.gif');
  }

  if (DISCORD !== interaction.user.tag) {
    registerEmbed
      .setTitle('Mismatched Tag')
      .setDescription('That Minecraft account currently has a different Discord account linked! If that is your account, follow the guide below to relink it:')
      .setImage('https://i.imgur.com/gGKd2s8.gif');
  }

  await new SQLiteWrapper().newUser({
    table: 'api',
    data: {
      discordID: interaction.user.id,
      uuid: uuid,
      urls: '',
      lastUpdated: Date.now(),
      firstLogin: first_login,
      lastLogin: last_login,
      lastLogout: last_logout,
      version: mc_version,
      language: language,
      mostRecentGameType: last_game,
      lastClaimedReward: 0,
      rewardScore: streak_current,
      rewardHighScore: streak_best,
      totalDailyRewards: claimed_daily,
    },
  });

	await interaction.editReply({ embeds: [] });
};