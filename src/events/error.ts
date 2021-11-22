import type { EventProperties } from '../@types/client';
import { formattedUnix } from '../util/utility';

export const properties: EventProperties = {
  name: 'error',
  once: false,
  hasParameter: true,
};

export const execute = (error: Error): void => {
  const time = formattedUnix({
    date: true,
    utc: true,
  });

  console.log(`${time} | discord.js Error:`, error);
};