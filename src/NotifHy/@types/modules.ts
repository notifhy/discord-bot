import type { CleanHypixelPlayer, CleanHypixelStatus } from './hypixel';
import type { Client } from 'discord.js';
import type { Locale } from './locales';
import type {
    UserAPIData,
    UserData,
} from './database';

/* eslint-disable no-unused-vars */

export type ModuleNames = 'defender' | 'friend' | 'rewards';

export type ModuleDifferences = {
    newData: Partial<CleanHypixelPlayer & CleanHypixelStatus>,
    oldData: Partial<CleanHypixelPlayer & CleanHypixelStatus>,
};

export interface ClientModule {
    properties: {
        name: string,
        cleanName: string,
        onlineStatusAPI: boolean,
    },
    execute(
        {
            client,
            differences,
            baseLocale,
            userAPIData,
            userData,
        }: {
            client: Client,
            differences: ModuleDifferences,
            baseLocale: Locale['modules'],
            userAPIData: UserAPIData,
            userData: UserData,
        }
    ): Promise<void>,
}