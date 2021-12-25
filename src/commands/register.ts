import type { CommandExecute, CommandProperties } from '../@types/client';
import type { Slothpixel } from '../@types/hypixel';
import { BetterEmbed } from '../util/utility';
import { CommandInteraction } from 'discord.js';
import {
    FriendsModule,
    RawFriendsModule,
    RawRewardsModule,
    RawUserAPIData,
    RewardsModule,
    UserAPIData,
} from '../@types/database';
import { RegionLocales } from '../../locales/localesHandler';
import { Request } from '../util/Request';
import { SQLiteWrapper } from '../database';
import Constants from '../util/Constants';
import HTTPError from '../util/errors/HTTPError';

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
        options: [
            {
                name: 'player',
                type: '3',
                description: 'Your username or UUID',
                required: true,
            },
        ],
    },
};

export const execute: CommandExecute = async (
    interaction: CommandInteraction,
    { userData },
): Promise<void> => {
    const locale = RegionLocales.locale(userData.language).commands.register;
    const replace = RegionLocales.replace;

    const inputUUID =
        /^[0-9a-f]{8}(-?)[0-9a-f]{4}(-?)[1-5][0-9a-f]{3}(-?)[89AB][0-9a-f]{3}(-?)[0-9a-f]{12}$/i;
    const inputUsername = /^[a-zA-Z0-9_-]{1,24}$/g;
    const input = interaction.options.getString('player', true);
    const inputType = inputUUID.test(input) === true ? 'UUID' : 'username';

    if (
        inputUUID.test(input) === false &&
        inputUsername.test(input) === false
    ) {
        const invalidEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(locale.invalid.title)
            .setDescription(locale.invalid.description);
        await interaction.editReply({ embeds: [invalidEmbed] });
        return;
    }

    const url = `${Constants.urls.slothpixel}/players/${input}`;
    const response = await new Request({}).request(url);

    if (response.status === 404) {
        const notFoundEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle(locale.notFound.title)
            .setDescription(
                replace(locale.notFound.description, {
                    inputType: inputType,
                }),
            );
        await interaction.editReply({ embeds: [notFoundEmbed] });
        return;
    }

    if (response.ok === false) {
        throw new HTTPError({
            message: response.statusText,
            response: response,
            url: url,
        });
    }

    const {
        uuid,
        first_login,
        last_login,
        last_logout,
        mc_version,
        language,
        rewards: { streak_current, streak_best, claimed_daily, claimed },
        links: { DISCORD },
    } = (await response.json()) as Slothpixel;

    if (DISCORD === null) {
        const unlinkedEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle(locale.unlinked.title)
            .setDescription(locale.unlinked.description)
            .setImage(Constants.urls.linkDiscord);
        await interaction.editReply({ embeds: [unlinkedEmbed] });
        return;
    }

    if (DISCORD !== interaction.user.tag) {
        const mismatchedEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle(locale.mismatched.title)
            .setDescription(locale.mismatched.description)
            .setImage(Constants.urls.linkDiscord);
        await interaction.editReply({ embeds: [mismatchedEmbed] });
        return;
    }

    await Promise.all([
        SQLiteWrapper.newUser<UserAPIData, RawUserAPIData>({
            table: Constants.tables.api,
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
                gameMode: null,
                gameMap: null,
                lastClaimedReward: null,
                rewardScore: streak_current,
                rewardHighScore: streak_best,
                totalDailyRewards: claimed_daily,
                totalRewards: claimed,
                history: [],
            },
        }),
        SQLiteWrapper.newUser<FriendsModule, RawFriendsModule>({
            table: Constants.tables.friends,
            data: {
                discordID: interaction.user.id,
                ...Constants.defaults.friends,
            },
        }),
        SQLiteWrapper.newUser<RewardsModule, RawRewardsModule>({
            table: Constants.tables.rewards,
            data: {
                discordID: interaction.user.id,
                ...Constants.defaults.rewards,
            },
        }),
    ]);

    const registeredEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(locale.title)
        .setDescription(locale.description)
        .addField(locale.field.name, locale.field.value);

    await interaction.editReply({ embeds: [registeredEmbed] });

    const users = (
        await SQLiteWrapper.getAllUsers({
            table: 'api',
            columns: ['discordID'],
        })
    ).length;

    interaction.client.user!.setActivity({
        type: 'WATCHING',
        name: `${users} accounts | /register /help | ${interaction.client.guilds.cache.size} servers`,
    });
};