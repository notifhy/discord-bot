import { type users as User } from '@prisma/client';
import { type CleanHypixelData } from '../@types/Hypixel';
import { type Changes } from './Data';
import { ModuleErrorHandler } from '../errors/ModuleErrorHandler';
import { Base } from '../structures/Base';

/* eslint-disable no-await-in-loop */

export class Modules extends Base {
    public async execute(user: User, newData: CleanHypixelData, changes: Changes) {
        const statusAPIEnabled = newData.lastLogin !== null && newData.lastLogout !== null;

        const modulesStore = this.container.stores.get('modules').filter(
            (module) => user[module.databaseColumn]
            && (statusAPIEnabled || module.requireStatusAPI === false),
        );

        // eslint-disable-next-line no-restricted-syntax
        for (const module of modulesStore.values()) {
            try {
                await module.run(user, newData, changes);
            } catch (error) {
                await new ModuleErrorHandler(error, module, user).init();
            }
        }

        // add logic for notifying about api toggles
    }
}