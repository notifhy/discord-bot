import type { ClientCommand } from '../@types/client';
import type { SlothpixelPlayer } from '../@types/hypixel';
import type {
    DefenderModule,
    FriendsModule,
    RewardsModule,
    UserAPIData,
} from '../@types/database';
import { BetterEmbed } from '../../utility/utility';
import { Constants } from '../utility/Constants';
import { HTTPError } from '../errors/HTTPError';
import { Log } from '../../utility/Log';
import { RegionLocales } from '../locales/RegionLocales';
import { Request } from '../../utility/Request';
import { setActivity } from '../utility/utility';
import { SQLite } from '../../utility/SQLite';

export const properties: ClientCommand['properties'] = {
    name: 'register',
    description: 'Register and setup your profile to begin using the modules that this bot offers.',
    cooldown: 5_000,
    ephemeral: true,
    noDM: false,
    ownerOnly: false,
    requireRegistration: false,
    structure: {
        name: 'register',
        description: 'Register to begin using the modules that this bot offers',
        options: [
            {
                name: 'player',
                type: 3,
                description: 'Your username or UUID',
                required: true,
            },
        ],
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const text = RegionLocales.locale(locale).commands.register;
    const replace = RegionLocales.replace;

    const userAPIData = SQLite.getUser<UserAPIData>({
         discordID: interaction.user.id,
        table: Constants.tables.api,
        allowUndefined: true,
        columns: ['discordID'],
    });

    if (userAPIData !== undefined) {
        const alreadyRegisteredEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle(text.alreadyRegistered.title)
            .setDescription(text.alreadyRegistered.description);

        Log.interaction(interaction, 'Already registered');

        await interaction.editReply({ embeds: [alreadyRegisteredEmbed] });
        return;
    }

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
            .setTitle(text.invalid.title)
            .setDescription(text.invalid.description);

        Log.interaction(interaction, 'Invalid input', input);

        await interaction.editReply({ embeds: [invalidEmbed] });
        return;
    }

    const url = `${Constants.urls.slothpixel}players/${input}`;
    const response = await new Request().request(url);

    if (response.status === 404) {
        const notFoundEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle(text.notFound.title)
            .setDescription(replace(text.notFound.description, {
                inputType: inputType,
            }));

        Log.interaction(interaction, 404);

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
    } = (await response.json()) as SlothpixelPlayer;

    const uuids = (
        SQLite.getAllUsers<UserAPIData>({
            table: Constants.tables.api,
            columns: ['uuid'],
        })
    ).map(user => user.uuid);

    if (uuids.includes(uuid)) {
        const alreadyUsedEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle(text.alreadyUsed.title)
            .setDescription(text.alreadyUsed.description);

        Log.interaction(interaction, 'UUID already used');

        await interaction.editReply({ embeds: [alreadyUsedEmbed] });
        return;
    }

    if (DISCORD === null) {
        const unlinkedEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle(text.unlinked.title)
            .setDescription(text.unlinked.description)
            .setImage(Constants.urls.linkDiscord);

        Log.interaction(interaction, 'Not linked');

        await interaction.editReply({ embeds: [unlinkedEmbed] });
        return;
    }

    if (DISCORD !== interaction.user.tag) {
        const mismatchedEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle(text.mismatched.title)
            .setDescription(text.mismatched.description)
            .setImage(Constants.urls.linkDiscord);

        Log.interaction(interaction, 'Mismatch');

        await interaction.editReply({ embeds: [mismatchedEmbed] });
        return;
    }

    SQLite.createTransaction(() => {
        SQLite.newUser<UserAPIData>({
            table: Constants.tables.api,
            data: {
                discordID: interaction.user.id,
                uuid: uuid,
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
            },
        });

        SQLite.newUser<DefenderModule>({
            table: Constants.tables.defender,
            data: {
                discordID: interaction.user.id,
                languages: language ? [language] : [],
                versions: mc_version?.match(/^1.\d+/m) || [],
            },
        });

        SQLite.newUser<FriendsModule>({
            table: Constants.tables.friends,
            data: {
                discordID: interaction.user.id,
            },
        });

        SQLite.newUser<RewardsModule>({
            table: Constants.tables.rewards,
            data: {
                discordID: interaction.user.id,
            },
        });
    });

    const registeredEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(text.title)
        .setDescription(text.description)
        .addFields({
            name: text.field.name,
            value: text.field.value,
        });

    Log.interaction(interaction, 'Success');

    await interaction.editReply({ embeds: [registeredEmbed] });

    setActivity(interaction.client);
};