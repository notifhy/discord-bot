import type { EventProperties } from '../@types/client';
import { Log } from '../util/Log';

export const properties: EventProperties = {
    name: 'error',
    once: false,
};

export const execute = (error: Error): void => {
    Log.error(`discord.js Error:`, error);
};