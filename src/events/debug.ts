import type { EventProperties } from '../@types/client';
import { formattedUnix } from '../util/utility';

export const properties: EventProperties = {
    name: 'debug',
    once: false,
};

export const execute = (info: string): void => {
    return;
    console.log(`${formattedUnix({ date: true, utc: true })} |`, info);
};