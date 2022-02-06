import type { ClientEvent } from '../@types/client';
import { formattedUnix } from '../../util/utility';
import { Log } from '../../util/Log';

export const properties: ClientEvent['properties'] = {
    name: 'debug',
    once: false,
};

export const execute: ClientEvent['execute'] = (info: string): void => {
    return;
    Log.log(`${formattedUnix({ date: true, utc: true })} |`, info);
};