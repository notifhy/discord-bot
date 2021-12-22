import { ColorResolvable, Permissions } from 'discord.js';
import { Tables } from '../@types/database';

export default {
    colors: {
        error: '#AA0000' as ColorResolvable,
        warning: '#FF5555' as ColorResolvable,
        normal: '#7289DA' as ColorResolvable,
        ok: '#FFAA00' as ColorResolvable,
        on: '#00AA00' as ColorResolvable,
        off: '#555555' as ColorResolvable,
    },
    defaults: {
        friends: {
            channel: null,
            suppressNext: false,
        },
        rewards: {
            alertTime: null,
            claimNotification: false,
            lastNotified: 0,
            milestones: true,
            notificationInterval: 1_000 * 60 * 30,
        },
        menuIncrements: 5,
        menuFastIncrements: 20,
    },
    emoji: {
        power: '<:toggle:922945383104135228>',
        hashtag: '<:channel:922980930379984956>',
        clock: '<:clock:922981726676992070>',
        loop: '<:interval:922980170124628018>',

    },
    limits: {
        embedDescription: 4096,
        embedField: 1024,
        userAPIDataHistory: 500,
    },
    modules: {
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
                7, 30, 60, 90, 100, 150, 200, 250, 300, 365, 500, 750, 1000,
            ],
        },
    },
    ms: {
        day: 86_400_000,
        hour: 3_600_000,
        minute: 60_000,
        second: 1_000,
    },
    tables: {
        users: 'users' as Tables,
        api: 'api' as Tables,
        friends: 'friends' as Tables,
        rewards: 'rewards' as Tables,
    },
    urls: {
        linkDiscord: 'https://i.imgur.com/gGKd2s8.gif',
        hypixel: 'https://api.hypixel.net/',
        slothpixel: 'https://api.slothpixel.me/api',
    },
};
