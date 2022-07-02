import type { ClientEvent } from '../@types/client';
import { Log } from '../utility/Log';

export const properties: ClientEvent['properties'] = {
    name: 'warn',
    once: false,
};

export const execute: ClientEvent['execute'] = (info: string): void => {
    Log.log('discord.js Warning', info);
};