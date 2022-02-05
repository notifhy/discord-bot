import type { ClientEvent } from '../@types/client';
import { formattedUnix } from '../../util/utility';

export const properties: ClientEvent['properties'] = {
    name: 'debug',
    once: false,
};

export const execute: ClientEvent['execute'] = (info: string): void => {
    return;
    console.log(`${formattedUnix({ date: true, utc: true })} |`, info);
};