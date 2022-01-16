import type { CleanHypixelPlayer, CleanHypixelStatus } from './hypixel';
import type { Client } from 'discord.js';
import type { UserAPIData } from './database';

export type ModuleNames = 'defender' | 'friend' | 'rewards';

export type Differences = {
    primary: Partial<CleanHypixelPlayer & CleanHypixelStatus>,
    secondary: Partial<CleanHypixelPlayer & CleanHypixelStatus>,
};

export interface ClientModule {
    properties: {
        name: string,
        cleanName: string,
    },
    execute(
        {
            client,
            differences,
            userAPIData,
        }: {
            client: Client,
            differences: Differences,
            userAPIData: UserAPIData,
        }
    ): Promise<void>,
}