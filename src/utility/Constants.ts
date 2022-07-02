import {
    ColorResolvable,
    Permissions,
    PresenceData,
} from 'discord.js';
import { Table } from '../@types/database';
import gameTypes from '../../assets/gameTypes.json';
import modes from '../../assets/modes.json';

export const Constants = {
    clean: {
        gameTypes: gameTypes,
        modes: modes,
    },
    colors: {
        error: 0xAA0000 as ColorResolvable,
        warning: 0xFF5555 as ColorResolvable,
        normal: 0x2f3136 as ColorResolvable, // #7289DA
        ok: 0xFFAA00 as ColorResolvable,
        on: 0x00AA00 as ColorResolvable,
        off: 0x555555 as ColorResolvable,
    },
    defaults: {
        defenderAlerts: {
            login: false,
            logout: false,
            version: false,
            gameType: false,
            language: false,
        },
        language: 'en-US',
        menuIncrements: 5,
        menuFastIncrements: 20,
        performance: {
            start: 0, // Date.now()
            uses: 0, // uses
            total: 0,
            fetch: 0,
            process: 0,
            modules: 0,
        },
        presence: {
            activities: [{
                name: '{{ accounts }} accounts | /register /help | {{ servers }} servers',
                type: 'WATCHING',
            }],
            status: 'online',
        } as PresenceData,
        request: {
            restRequestTimeout: 5000,
            retryLimit: 2,
        },
    },
    emoji: {
        bell: '<:bell:952009463307579492>',
        commentdiscussion: '<:commentdiscussion:952009471822024705> ',
        gitbranch: '<:gitbranch:952009473864634368>',
        hash: '<:hash:952009472874803230',
        hourglass: '<:hourglass:952009472761528400>',
        issueclosed: '<:issueclosed:952009474636402798>',
        shieldlock: '<:shieldlock:952009473923375126> ',
        sync: '<:sync:952009474179223553>',
        trophy: '<:trophy:952009474472829008>',
        zap: '<:zap:952009474342780978> ',
        backward: '<:backward:928525709004111892>',
        forward: '<:forward:928525657829412864>',
        fastBackward: '<:fastBackward:928525727035441175>',
        fastForward: '<:fastForward:928525679509786665>',
    },
    limits: {
        embedDescription: 4096,
        embedField: 1024,
        performanceHistory: 50,
        userAPIDataHistory: 1000,
    },
    ms: {
        day: 86_400_000,
        hour: 3_600_000,
        minute: 60_000,
        second: 1_000,
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
                "core" TEXT NOT NULL DEFAULT 'true',
                "devMode" TEXT NOT NULL DEFAULT 'false',
                "keyPercentage" INTEGER NOT NULL DEFAULT 0.5,
                "restRequestTimeout" INTEGER NOT NULL DEFAULT 5000,
                "retryLimit" INTEGER NOT NULL DEFAULT 2
            )`,
            defender: `CREATE TABLE IF NOT EXISTS "defender" (
                "discordID" TEXT NOT NULL UNIQUE,
                "alerts" TEXT NOT NULL DEFAULT '{"login":true,"logout":true,"version":true,"gameType":true,"language":true}',
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