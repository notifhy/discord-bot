import type { rewards as Rewards, users as User } from '@prisma/client';
import type { CleanHypixelData } from '../@types/Hypixel';
import type { Changes } from '../core/Data';
import { Module } from '../structures/Module';

export class RewardsModule extends Module<Rewards> {
    public constructor(context: Module.Context, options: Module.Options) {
        super(context, {
            ...options,
            name: 'rewards',
            localization: 'modulesRewardsName',
            requireStatusAPI: true,
        });
    }

    public async isEnabled(user: User) {
        return this.container.database.rewards.findUniqueOrThrow({
            where: {
                id: user.id,
            },
        });
    }

    public async run(user: User, newData: CleanHypixelData, changes: Changes) {}
}
