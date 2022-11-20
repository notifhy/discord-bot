import type { users as User } from '@prisma/client';
import type { Collection } from 'discord.js';
import type { CleanHypixelData } from '../@types/Hypixel';
import { Changes, Data } from './Data';
import { ModuleErrorHandler } from '../errors/ModuleErrorHandler';
import { Base } from '../structures/Base';
import { BetterEmbed } from '../structures/BetterEmbed';
import type { Module, ModuleOptions } from '../structures/Module';
import { i18n as Internationalization } from '../locales/i18n';
import { Options } from '../utility/Options';

/* eslint-disable no-await-in-loop */

export class Modules extends Base {
    public async execute(user: User, newData: CleanHypixelData, changes: Changes) {
        const onlineStatusAPIEnabled = newData.lastLogin !== null && newData.lastLogout !== null;

        const modules = await this.container.database.modules.findUniqueOrThrow({
            where: {
                id: user.id,
            },
        });

        const enabledModulesStore = this.container.stores
            .get('modules')
            .filter((module) => modules[module.name]);

        const availableModulesStore = enabledModulesStore.filter(
            (module) => (onlineStatusAPIEnabled || module.requireOnlineStatusAPI === false),
        );

        // eslint-disable-next-line no-restricted-syntax
        for (const module of availableModulesStore.values()) {
            try {
                this.container.logger.debug(
                    `User ${user.id}`,
                    `${this.constructor.name}:`,
                    `Running ${module.name}.`,
                );

                await module.cronWithData?.(user, newData, changes);
            } catch (error) {
                await new ModuleErrorHandler(error, module, user).init();
            }
        }

        await this.handleAPIChanges(changes, enabledModulesStore, user);
    }
}
