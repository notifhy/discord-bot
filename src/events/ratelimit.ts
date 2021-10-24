import { formattedNow } from '../utility';
import type { RateLimitData } from 'discord.js';

export const name = 'rateLimit';
export const once = false;
export const parameter = true;

export const execute = (rateLimitInfo: RateLimitData): void => {
  console.error(`${formattedNow({ date: true })} | Rate limit: ${rateLimitInfo}`);
};