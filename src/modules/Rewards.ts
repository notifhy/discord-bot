import type { users as User } from '@prisma/client';
import type { CleanHypixelData } from '../@types/Hypixel';
import type { Changes } from '../core/Data';
import { Module } from '../structures/Module';

export class RewardsModule extends Module {
    public constructor(context: Module.Context, options: Module.Options) {
        super(context, {
            ...options,
            name: 'rewards',
            databaseColumn: 'rewardsModule',
            localization: 'modulesRewardsName',
            requireStatusAPI: true,
        });
    }

    public async run(user: User, newData: CleanHypixelData, changes: Changes) {}
}
