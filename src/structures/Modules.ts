import type { users as User } from '@prisma/client';
import type { Collection } from 'discord.js';
import { Base } from './Base';
import { BetterEmbed } from './BetterEmbed';
import { ModuleErrorHandler } from '../errors/ModuleErrorHandler';
import { Changes, Hypixel } from './Hypixel';
import { i18n as Internationalization } from '../locales/i18n';
import { Logger } from './Logger';
import type { Module, ModuleOptions } from './Module';
import { Options } from '../utility/Options';

/* eslint-disable no-await-in-loop */

export class Modules extends Base {
    public lastUserFetches: number;

    public constructor() {
        super();
        this.lastUserFetches = 0;
    }

    public async fetch(user: User) {
        const data = await this.container.hypixel.fetch(user);
        Modules.handleDataChanges(data.changes, user);
        return data;
    }

    public static async executeModules(
        user: User,
        availableModules: Collection<string, Module<ModuleOptions>>,
    ) {
        // eslint-disable-next-line no-restricted-syntax
        for (const module of availableModules.values()) {
            try {
                this.container.logger.debug(
                    this,
                    Logger.moduleContext(user),
                    `Running ${module.name} cron.`,
                );

                await module.cron!(user);
            } catch (error) {
                await new ModuleErrorHandler(error, module, user).init();
            }
        }

        this.container.logger.debug(
            this,
            Logger.moduleContext(user),
            `Ran ${availableModules.size} modules.`,
        );
    }

    private static async handleDataChanges(changes: Changes, user: User) {
        const embeds: BetterEmbed[] = [];

        const userModules = await this.container.database.modules.findUniqueOrThrow({
            where: {
                id: user.id,
            },
        });

        const enabledModules = this.container.stores
            .get('modules')
            .filter((module) => userModules[module.name]);

        const requiresOnlineAPI = enabledModules.find((module) => module.requireOnlineStatusAPI);

        if (requiresOnlineAPI) {
            if (Hypixel.isOnlineAPIMissing(changes)) {
                const i18n = new Internationalization(user.locale);

                embeds.push(
                    new BetterEmbed({ text: i18n.getMessage('hypixelDataMissingAPIFooter') })
                        .setColor(Options.colorsNormal)
                        .setTitle(i18n.getMessage('hypixelDataMissingOnlineStatusAPITitle'))
                        .setDescription(
                            i18n.getMessage('hypixelDataMissingOnlineStatusAPIDescription'),
                        ),
                );

                this.container.logger.info(
                    this,
                    Logger.moduleContext(user),
                    'Missing Online Status API data.',
                );
            } else if (Hypixel.isOnlineAPIReceived(changes)) {
                const i18n = new Internationalization(user.locale);

                embeds.push(
                    new BetterEmbed({ text: i18n.getMessage('hypixelDataMissingAPIFooter') })
                        .setColor(Options.colorsNormal)
                        .setTitle(i18n.getMessage('hypixelDataReceivedOnlineStatusAPITitle'))
                        .setDescription(
                            i18n.getMessage('hypixelDataReceivedOnlineStatusAPIDescription'),
                        ),
                );

                this.container.logger.info(
                    this,
                    Logger.moduleContext(user),
                    'Received Online Status API data.',
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
