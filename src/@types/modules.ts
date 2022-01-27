import type { CleanHypixelPlayer, CleanHypixelStatus } from './hypixel';
import type { Client } from 'discord.js';
import type { Locale } from './locales';
import type { UserAPIData, UserData } from './database';

export type ModuleNames = 'defender' | 'friend' | 'rewards';

export type Differences = {
    primary: Partial<CleanHypixelPlayer & CleanHypixelStatus>,
    secondary: Partial<CleanHypixelPlayer & CleanHypixelStatus>,
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
            differences: Differences,
            baseLocale: Locale['modules'],
            userAPIData: UserAPIData,
            userData: UserData,
        }
    ): Promise<void>,
}