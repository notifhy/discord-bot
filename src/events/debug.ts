import type { EventProperties } from '../@types/index';
import { formattedUnix } from '../util/utility';

export const properties: EventProperties = {
  name: 'debug',
  once: false,
  hasParameter: true,
};

export const execute = (info: string): void => {
  console.log(`${formattedUnix({ date: true, utc: true })} |`, info);
};