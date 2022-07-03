import { RateLimitData } from 'discord.js';
import { type ClientEvent } from '../@types/client';
import { Log } from '../utility/Log';

export const properties: ClientEvent['properties'] = {
    name: 'rateLimit',
    once: false,
};

export const execute: ClientEvent['execute'] = (rateLimitInfo: RateLimitData): void => {
    Log.error('Rate limit:', rateLimitInfo);
};