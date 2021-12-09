import { ColorResolvable } from 'discord.js';
import { Tables } from '../@types/database';

export default {
    ms: {
        day: 86_400_000,
        hour: 3_600_000,
        minute: 60_000,
        second: 1_000,
    },
    color: {
        error: '#AA0000' as ColorResolvable,
        warning: '#FF5555' as ColorResolvable,
        normal: '#7289DA' as ColorResolvable,
        on: '#00AA00' as ColorResolvable,
        off: '#555555' as ColorResolvable,
    },
    limits: {
        embedDescription: 4096,
        embedField: 1024,
    },
    tables: {
        users: 'users' as Tables,
        api: 'api' as Tables,
        friends: 'friends' as Tables,
        rewards: 'rewards' as Tables,
    },
};
