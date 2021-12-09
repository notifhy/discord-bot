import type { EventProperties } from '../@types/client';
import { formattedUnix } from '../util/utility';

export const properties: EventProperties = {
    name: 'error',
    once: false,
};

export const execute = (error: Error): void => {
    const time = formattedUnix({
        date: true,
        utc: true,
    });

    console.error(`${time} | discord.js Error:`, error);
};
