import type { defender as Defender, users as User } from '@prisma/client';
import type { CleanHypixelData } from '../@types/Hypixel';
import type { Changes } from '../core/Data';
import { Module } from '../structures/Module';

export class DefenderModule extends Module<Defender> {
    public constructor(context: Module.Context, options: Module.Options) {
        super(context, {
            ...options,
            name: 'defender',
            localization: 'modulesDefenderName',
            requireStatusAPI: true,
        });
    }

    public async isEnabled(user: User) {
        return this.container.database.defender.findUniqueOrThrow({
            where: {
                id: user.id,
            },
        });
    }

    public async run(user: User, newData: CleanHypixelData, changes: Changes) {}
}
