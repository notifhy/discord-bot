import type { CleanHypixelPlayer } from './hypixel';
import type { UserAPIData } from './database';
import { ModuleHandler } from '../module/ModuleHandler';

export type ModuleNames = 'defender' | 'friend' | 'rewards';

export type Differences = {
    primary: Partial<CleanHypixelPlayer>;
    secondary: Partial<UserAPIData>;
};

export interface ClientModule {
    properties: {
        name: string;
        cleanName: string;
    };
    execute({
        client,
        differences,
        userAPIData,
    }: ModuleHandler
    ): Promise<void>;
}
