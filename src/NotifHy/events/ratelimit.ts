import type { ClientEvent } from '../../@types/client';
import type { RateLimitData } from 'discord.js';
import { formattedUnix } from '../../util/utility';
import { Log } from '../../util/Log';

export const properties: ClientEvent['properties'] = {
    name: 'rateLimit',
    once: false,
};

export const execute: ClientEvent['execute'] = (rateLimitInfo: RateLimitData): void => {
    Log.error(
        `${formattedUnix({ date: true, utc: true })} | Rate limit:`,
        rateLimitInfo,
    );
};