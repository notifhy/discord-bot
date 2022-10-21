import type { friends as Friends, users as User } from '@prisma/client';
import type { CleanHypixelData } from '../@types/Hypixel';
import type { Changes } from '../core/Data';
import { Module } from '../structures/Module';

export class FriendsModule extends Module<Friends> {
    public constructor(context: Module.Context, options: Module.Options) {
        super(context, {
            ...options,
            name: 'friends',
            localization: 'modulesFriendsName',
            requireStatusAPI: true,
        });
    }

    public async isEnabled(user: User) {
        return this.container.database.friends.findUniqueOrThrow({
            where: {
                id: user.id,
            },
        });
    }

    public async run(user: User, newData: CleanHypixelData, changes: Changes) {}
}
