import { ColorResolvable } from 'discord.js';
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
    },
    limits: {
        embedDescription: 4096,
        embedField: 1024,
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
