import { Table } from '../@types/database';
import {
    ColorResolvable,
    Permissions,
} from 'discord.js';
import gameTypes from '../../../assets/gameTypes.json';
import modes from '../../../assets/modes.json';

export const Constants = {
    clean: {
        gameTypes: gameTypes,
        modes: modes,
    },
    colors: {
        error: 0xAA0000 as ColorResolvable,
        warning: 0xFF5555 as ColorResolvable,
        normal: 0x2f3136 as ColorResolvable, //#7289DA
        ok: 0xFFAA00 as ColorResolvable,
        on: 0x00AA00 as ColorResolvable,
        off: 0x555555 as ColorResolvable,
    },
    defaults: {
        language: 'en-US',
        menuIncrements: 5,
        menuFastIncrements: 20,
        performance: {
            start: 0, //Date.now()
            uses: 0, //uses
            total: 0,
            fetch: 0,
            process: 0,
            modules: 0,
        },
    },
    emoji: {
        alert: '<:alert:929126565240000513>',
        backward: '<:backward:928525709004111892>',
        celebration: '<:celebration:929126553445613568>',
        checkmark: '<:checkmark:929126538597765151>',
        clock: '<:clock:929126524785922139>',
        forward: '<:forward:928525657829412864>',
        fastBackward: '<:fastBackward:928525727035441175>',
        fastForward: '<:fastForward:928525679509786665>',
        gear: '<:gear:929126504791691265>',
        hashtag: '<:hashtag:929126488194813973>',
        interval: '<:interval:929126473724477500>',
        power: '<:toggle:929126460134944858>',
        speech: '<:speech:929126444704100382>',
        swords: '<:swords:930282221779161178>',
        version: '<:version:930282181228625990>',
    },
    limits: {
        embedDescription: 4096,
        embedField: 1024,
        performanceHistory: 50,
        userAPIDataHistory: 1000,
    },
    modules: {
        defender: {
            permissions: [
                Permissions.FLAGS.EMBED_LINKS,
                Permissions.FLAGS.SEND_MESSAGES,
                Permissions.FLAGS.VIEW_CHANNEL,
            ],
        },
        friends: {
            permissions: [
                Permissions.FLAGS.EMBED_LINKS,
                Permissions.FLAGS.SEND_MESSAGES,
                Permissions.FLAGS.VIEW_CHANNEL,
            ],
        },
        rewards: {
            hypixelTimezone: 'EST5EDT',
            milestones: [
                7,
                30,
                60,
                90,
                100,
                150,
                200,
                250,
                300,
                365,
                500,
                750,
                1000,
            ],
        },
    },
    tables: {
        users: 'users' as Table,
        api: 'api' as Table,
        defender: 'defender' as Table,
        friends: 'friends' as Table,
        rewards: 'rewards' as Table,
        create: {
            api: `CREATE TABLE IF NOT EXISTS "api" (
                "discordID" TEXT NOT NULL UNIQUE,
                "uuid" TEXT NOT NULL UNIQUE,
                "modules" TEXT NOT NULL DEFAULT '[]',
                "lastUpdated" INTEGER NOT NULL,
                "firstLogin" INTEGER,
                "lastLogin" INTEGER,
                "lastLogout" INTEGER,
                "version" TEXT,
                "language" TEXT NOT NULL,
                "gameType" TEXT,
                "gameMode" TEXT,
                "gameMap" TEXT,
                "lastClaimedReward" INTEGER,
                "rewardScore" INTEGER,
                "rewardHighScore" INTEGER,
                "totalDailyRewards" INTEGER,
                "totalRewards" INTEGER,
                "history" TEXT NOT NULL DEFAULT '[]'
            )`,
            config: `CREATE TABLE IF NOT EXISTS "config" (
                "blockedGuilds" TEXT NOT NULL DEFAULT '[]',
                "blockedUsers" TEXT NOT NULL DEFAULT '[]',
                "devMode" TEXT NOT NULL DEFAULT 'false',
                "enabled" TEXT NOT NULL DEFAULT 'true'
            )`,
            defender: `CREATE TABLE IF NOT EXISTS "defender" (
                "discordID" TEXT NOT NULL UNIQUE,
                "alerts" TEXT NOT NULL DEFAULT '{"login":true,"logout":true,"version":true,"gameTypes":true,"language":true}',
                "gameTypes" TEXT NOT NULL DEFAULT '[]',
                "channel" TEXT DEFAULT null,
                "languages" TEXT NOT NULL DEFAULT '[]',
                "versions" TEXT NOT NULL DEFAULT '[]'
            )`,
            friends: `CREATE TABLE IF NOT EXISTS "friends" (
                "discordID" TEXT NOT NULL UNIQUE,
                "channel" TEXT DEFAULT null
            )`,
            rewards: `CREATE TABLE IF NOT EXISTS "rewards" (
                "discordID" TEXT NOT NULL UNIQUE,
                "alertTime" INTEGER DEFAULT null,
                "claimNotification" INTEGER NOT NULL DEFAULT 'true',
                "lastNotified" INTEGER NOT NULL DEFAULT 0,
                "milestones" TEXT NOT NULL DEFAULT 'true',
                "notificationInterval" INTEGER NOT NULL DEFAULT 1800000
            )`,
            users: `CREATE TABLE IF NOT EXISTS "users" (
                "discordID" TEXT NOT NULL UNIQUE,
                "locale" TEXT NOT NULL DEFAULT 'en-US',
                "localeOverride" TEXT NOT NULL DEFAULT 'false',
                "systemMessages" TEXT NOT NULL DEFAULT '[]'
            )`,
        },
    },
    urls: {
        linkDiscord: 'https://i.imgur.com/gGKd2s8.gif',
        hypixel: 'https://api.hypixel.net/',
        playerDB: 'https://playerdb.co/api/player/minecraft/',
        slothpixel: 'https://api.slothpixel.me/api/',
    },
};