import type { ClientEvent } from '../../@types/client';
import { Log } from '../../util/Log';

export const properties: ClientEvent['properties'] = {
    name: 'warn',
    once: false,
};

export const execute: ClientEvent['execute'] = (info: string): void => {
    Log.error(
        `discord.js Warning:`,
        info,
    );
};