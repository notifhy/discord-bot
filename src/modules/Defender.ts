import type { users as User } from '@prisma/client';
import type { CleanHypixelData } from '../@types/Hypixel';
import type { Changes } from '../core/Data';
import { Module } from '../structures/Module';

export class DefenderModule extends Module {
    public constructor(context: Module.Context, options: Module.Options) {
        super(context, {
            ...options,
            name: 'defender',
            localization: 'modulesDefenderName',
            requireStatusAPI: true,
        });
    }

    public async run(_user: User, _data: CleanHypixelData, _changes: Changes) {}
}
