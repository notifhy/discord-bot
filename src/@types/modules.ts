import type { CleanHypixelPlayer } from './hypixel';
import type { Client } from 'discord.js';
import type { UserAPIData } from './database';

export type ModuleNames = 'defender' | 'friend' | 'rewards';

export type Differences = {
    primary: Partial<CleanHypixelPlayer>;
    secondary: Partial<UserAPIData>;
};

export interface ClientModule {
    properties: {
        name: string;
    };
    execute({
        client,
        differences,
        userAPIData,
    }: {
        client: Client;
        differences: Differences;
        userAPIData: UserAPIData;
    }): Promise<void>;
}
