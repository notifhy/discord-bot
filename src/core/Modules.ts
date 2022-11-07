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

                await module.run(user, newData, changes);
            } catch (error) {
                await new ModuleErrorHandler(error, module, user).init();
            }
        }

        await this.handleAPIChanges(changes, enabledModulesStore, user);
    }

    public async handleAPIChanges(
        changes: Changes,
        modules: Collection<string, Module<ModuleOptions>>,
        user: User,
    ) {
        const embeds: BetterEmbed[] = [];

        const requiresOnlineAPI = modules.find((module) => module.requireOnlineStatusAPI);

        if (requiresOnlineAPI) {
            if (Data.onlineAPIMissing(changes)) {
                const i18n = new Internationalization(user.locale);

                embeds.push(
                    new BetterEmbed({ text: i18n.getMessage('coreDataMissingAPIFooter') })
                        .setColor(Options.colorsNormal)
                        .setTitle(i18n.getMessage('coreDataMissingOnlineStatusAPITitle'))
                        .setDescription(i18n.getMessage('coreDataMissingOnlineStatusAPIDescription')),
                );

                this.container.logger.debug(
                    `User ${user.id}`,
                    `${this.constructor.name}:`,
                    'Missing Online Status API data.',
                );
            } else if (Data.onlineAPIReceived(changes)) {
                const i18n = new Internationalization(user.locale);

                embeds.push(
                    new BetterEmbed({ text: i18n.getMessage('coreDataMissingAPIFooter') })
                        .setColor(Options.colorsNormal)
                        .setTitle(i18n.getMessage('coreDataReceivedOnlineStatusAPITitle'))
                        .setDescription(i18n.getMessage('coreDataReceivedOnlineStatusAPIDescription')),
                );

                this.container.logger.debug(
                    `User ${user.id}`,
                    `${this.constructor.name}:`,
                    'Missing Online Status API data.',
                );
            }
        }

        if (embeds.length > 0) {
            const discordUser = await this.container.client.users.fetch(user.id);

            await discordUser.send({
                embeds: embeds,
            });
        }
    }
}
