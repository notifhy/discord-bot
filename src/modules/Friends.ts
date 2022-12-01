import type { users as User } from '@prisma/client';
import { Module } from '../structures/Module';

export class FriendsModule extends Module {
    public constructor(context: Module.Context, options: Module.Options) {
        super(context, {
            ...options,
            name: 'friends',
            localization: 'modulesFriendsName',
            cronIncludeAPIData: false,
        });
    }

    /**
     * Friends module will:
     * - Will operate on the upcoming mod
     */

    public override async event(_user: User) {}
}
