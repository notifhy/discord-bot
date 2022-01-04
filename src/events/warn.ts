import type { EventProperties } from '../@types/client';
import { Log } from '../util/Log';

export const properties: EventProperties = {
    name: 'warn',
    once: false,
};

export const execute = (info: string): void => {
    Log.error(
        `discord.js Warning:`,
        info,
    );
};
