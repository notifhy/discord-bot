import type { CleanHypixelPlayer, CleanHypixelStatus } from './hypixel';
import { ModuleHandler } from '../module/ModuleHandler';

export type ModuleNames = 'defender' | 'friend' | 'rewards';

export type Differences = {
    primary: Partial<CleanHypixelPlayer & CleanHypixelStatus>;
    secondary: Partial<CleanHypixelPlayer & CleanHypixelStatus>;
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
