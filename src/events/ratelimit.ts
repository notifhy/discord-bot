import type { EventProperties } from '../@types/client';
import type { RateLimitData } from 'discord.js';
import { formattedUnix } from '../util/utility';
import { Log } from '../util/Log';

export const properties: EventProperties = {
    name: 'rateLimit',
    once: false,
};

export const execute = (rateLimitInfo: RateLimitData): void => {
    Log.error(
        `${formattedUnix({ date: true, utc: true })} | Rate limit:`,
        rateLimitInfo,
    );
};
