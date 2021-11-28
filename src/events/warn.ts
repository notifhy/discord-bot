import type { EventProperties } from '../@types/client';
import { formattedUnix } from '../util/utility';

export const properties: EventProperties = {
  name: 'warn',
  once: false,
  hasParameter: true,
};

export const execute = (info: string): void => {
  console.warn(`${formattedUnix({ date: true, utc: true })} | discord.js Warning:`, info);
};