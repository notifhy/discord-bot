import { URL } from 'node:url';
import type { users as User } from '@prisma/client';
import type { Collection } from 'discord.js';
import type { CleanHypixelData, RawHypixelPlayer, RawHypixelStatus } from '../@types/Hypixel';
import { Base } from './Base';
import { BetterEmbed } from './BetterEmbed';
import { ModuleErrorHandler } from '../errors/ModuleErrorHandler';
import { Changes, Hypixel } from './Hypixel';
import { i18n as Internationalization } from '../locales/i18n';
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
        this.lastUserFetches = 0;

        const playerURL = new URL(Options.urlHypixelPlayer);
        playerURL.searchParams.append('uuid', user.uuid);

        const rawPlayerData = (await this.container.hypixel.request(
            playerURL.toString(),
        )) as RawHypixelPlayer;

        this.lastUserFetches += 1;

        let rawStatusData;

        if (
            rawPlayerData.player.lastLogin
            && rawPlayerData.player.lastLogout
            && rawPlayerData.player.lastLogin > rawPlayerData.player.lastLogout
        ) {
            const statusURL = new URL(Options.urlHypixelStatus);
            statusURL.search = playerURL.search;

            rawStatusData = (await this.container.hypixel.request(
                statusURL.toString(),
            )) as RawHypixelStatus;

            this.lastUserFetches += 1;
        }

        const data = {
            ...Hypixel.cleanPlayerData(rawPlayerData),
            ...Hypixel.cleanStatusData(rawStatusData),
        };

        const changes = await Modules.parse(user, data);

        return { changes: changes, data: data };
    }

    public static async executeModulesWithData(
        user: User,
        enabledModules: Collection<string, Module<ModuleOptions>>,
        newData: CleanHypixelData,
        changes: Changes,
    ) {
        const onlineStatusAPIEnabled = newData.lastLogin !== null && newData.lastLogout !== null;

        const availableModules = enabledModules.filter(
            (module) => onlineStatusAPIEnabled || module.cronRequireOnlineStatusAPI === false,
        );

        // eslint-disable-next-line no-restricted-syntax
        for (const module of availableModules.values()) {
            try {
                this.container.logger.debug(
                    `User ${user.id}`,
                    `${this.name}:`,
                    `Running ${module.name} cron with data.`,
                );

                await module.cron!(user, newData, changes);
            } catch (error) {
                await new ModuleErrorHandler(error, module, user).init();
            }
        }

        await Modules.handleDataChanges(changes, availableModules, user);
    }

    public static async executeModules(
        user: User,
        availableModules: Collection<string, Module<ModuleOptions>>,
    ) {
        // eslint-disable-next-line no-restricted-syntax
        for (const module of availableModules.values()) {
            try {
                this.container.logger.debug(
                    `User ${user.id}`,
                    `${this.name}:`,
                    `Running ${module.name} cron without data.`,
                );

                await module.cron?.(user);
            } catch (error) {
                await new ModuleErrorHandler(error, module, user).init();
            }
        }
    }

    public static async handleDataChanges(
        changes: Changes,
        modules: Collection<string, Module<ModuleOptions>>,
        user: User,
    ) {
        const embeds: BetterEmbed[] = [];

        const requiresOnlineAPI = modules.find((module) => module.cronRequireOnlineStatusAPI);

        if (requiresOnlineAPI) {
            if (Modules.isOnlineAPIMissing(changes)) {
                const i18n = new Internationalization(user.locale);

                embeds.push(
                    new BetterEmbed({ text: i18n.getMessage('coreDataMissingAPIFooter') })
                        .setColor(Options.colorsNormal)
                        .setTitle(i18n.getMessage('coreDataMissingOnlineStatusAPITitle'))
                        .setDescription(
                            i18n.getMessage('coreDataMissingOnlineStatusAPIDescription'),
                        ),
                );

                this.container.logger.info(
                    `User ${user.id}`,
                    `${this.name}:`,
                    'Missing Online Status API data.',
                );
            } else if (Modules.isOnlineAPIReceived(changes)) {
                const i18n = new Internationalization(user.locale);

                embeds.push(
                    new BetterEmbed({ text: i18n.getMessage('coreDataMissingAPIFooter') })
                        .setColor(Options.colorsNormal)
                        .setTitle(i18n.getMessage('coreDataReceivedOnlineStatusAPITitle'))
                        .setDescription(
                            i18n.getMessage('coreDataReceivedOnlineStatusAPIDescription'),
                        ),
                );

                this.container.logger.info(
                    `User ${user.id}`,
                    `${this.name}:`,
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

    public static isOnlineAPIMissing(changes: Changes) {
        return (
            changes.new.lastLogin === null
            && changes.old.lastLogin !== null
            && changes.new.lastLogout === null
            && changes.old.lastLogout !== null
        );
    }

    public static isOnlineAPIReceived(changes: Changes) {
        return (
            changes.new.lastLogin !== null
            && changes.old.lastLogin === null
            && changes.new.lastLogout !== null
            && changes.old.lastLogout === null
        );
    }

    public static shouldFetch(enabledModules: Collection<string, Module<ModuleOptions>>) {
        const modulesRequireData = enabledModules.filter((module) => module.cronIncludeAPIData);

        return modulesRequireData.size > 0;
    }

    private static async parse(user: User, newData: CleanHypixelData) {
        // https://github.com/prisma/prisma/issues/5042
        const oldData = ((await this.container.database.activities.findFirst({
            orderBy: {
                index: 'desc',
            },
            select: {
                firstLogin: true,
                lastLogin: true,
                lastLogout: true,
                version: true,
                language: true,
                gameType: true,
                gameMode: true,
                gameMap: true,
                lastClaimedReward: true,
                rewardScore: true,
                rewardHighScore: true,
                totalDailyRewards: true,
                totalRewards: true,
            },
            where: {
                id: {
                    equals: user.id,
                },
            },
        })) ?? {}) as CleanHypixelData;

        const changes = Hypixel.changes(newData, oldData);

        this.container.logger.debug(`${this.name}:`, 'Parsed data:', changes);

        if (Object.keys(changes.new).length > 0) {
            await this.container.database.activities.create({
                data: {
                    id: user.id,
                    timestamp: Date.now(),
                    ...newData,
                },
            });
        }

        return changes;
    }
}
