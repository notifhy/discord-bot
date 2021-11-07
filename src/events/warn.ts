import type { EventProperties } from '../@types/index';
import { formattedUnix } from '../util/utility';

export const properties: EventProperties = {
  name: 'warn',
  once: false,
  hasParameter: true,
};

export const execute = (info: string): void => {
  console.log(`${formattedUnix({ date: true, utc: true })} | Discord.js Warning:`, info);
};