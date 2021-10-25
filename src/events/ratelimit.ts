import type { EventProperties } from '../@types/index';
import type { RateLimitData } from 'discord.js';
import { formattedNow } from '../util/utility';

export const properties: EventProperties = {
  name: 'rateLimit',
  once: false,
  hasParameter: true,
};

export const execute = (rateLimitInfo: RateLimitData): void => {
  console.error(`${formattedNow({ date: true })} | Rate limit: ${JSON.stringify(rateLimitInfo)}`);
};