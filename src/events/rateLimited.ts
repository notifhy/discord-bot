import { type ClientEvent } from '../@types/client';
import { Log } from '../utility/Log';

export const properties: ClientEvent['properties'] = {
    name: 'rateLimited',
    once: false,
    rest: true,
};

export const execute: ClientEvent['execute'] = (rateLimitInfo: string): void => {
    Log.error('Rate limit:', rateLimitInfo);
};