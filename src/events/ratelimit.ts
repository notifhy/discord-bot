import type { EventProperties } from '../@types/index';
import type { RateLimitData } from 'discord.js';
import { formattedUnix } from '../util/utility';

export const properties: EventProperties = {
  name: 'rateLimit',
  once: false,
  hasParameter: true,
};

export const execute = (rateLimitInfo: RateLimitData): void => {
  console.error(`${formattedUnix({ date: true, utc: true })} | Rate limit: `, rateLimitInfo);
};