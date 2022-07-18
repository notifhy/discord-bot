import { type ClientEvent } from '../@types/client';
import { Log } from '../utility/Log';

export const properties: ClientEvent['properties'] = {
    name: 'error',
    once: false,
    rest: false,
};

export const execute: ClientEvent['execute'] = (error: Error): void => {
    Log.error('discord.js Error', error);
};