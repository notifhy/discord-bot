import type { EventProperties } from '../@types/index';
import { formattedUnix } from '../util/utility';

export const properties: EventProperties = {
  name: 'error',
  once: false,
  hasParameter: true,
};

export const execute = (error: Error): void => {
  console.log(`${formattedUnix({ date: true, utc: true })} | Discord.js Error:`, error);
};