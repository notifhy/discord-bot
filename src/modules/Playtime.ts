import type { users as User } from '@prisma/client';
import { Module } from '../structures/Module';

export class PlaytimeModule extends Module {
    public constructor(context: Module.Context, options: Module.Options) {
        super(context, {
            ...options,
            name: 'playtime',
            localizationFooter: 'modulesPlaytimeFooter',
            localizationName: 'modulesPlaytimeName',
            requireOnlineStatusAPI: false,
        });
    }

    /**
     * Friends module will:
     * - Will operate on the upcoming mod
     */

    public override async event(user: User) {
        this.container.logger.debug(this, 'User:', user);
    }
}
