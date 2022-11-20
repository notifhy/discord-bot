import { URL } from 'node:url';
import type { users as User } from '@prisma/client';
import type { Collection } from 'discord.js';
import type {
    CleanHypixelData,
    CleanHypixelPlayer,
    CleanHypixelStatus,
    HypixelAPIOk,
    RawHypixelPlayer,
    RawHypixelStatus,
} from '../@types/Hypixel';
import { Base } from './Base';
import { BetterEmbed } from './BetterEmbed';
import { i18n as Internationalization } from '../locales/i18n';
import type { Module, ModuleOptions } from './Module';
import { Request } from './Request';
import { Options } from '../utility/Options';

type PartialCleanHypixelData = Partial<CleanHypixelData>;

export type Changes = {
    new: PartialCleanHypixelData;
    old: PartialCleanHypixelData;
};

export class ModuleData extends Base {
    public fetches: number;

    public lastUserFetches: number;

    public constructor() {
        super();
        this.fetches = 0;
        this.lastUserFetches = 0;
    }

    public async fetch(user: User) {
        this.lastUserFetches = 0;

        const playerURL = new URL(Options.urlHypixelPlayer);
        playerURL.searchParams.append('uuid', user.uuid);

        const rawPlayerData = (await this.request(playerURL)) as RawHypixelPlayer;

        this.lastUserFetches += 1;

        let rawStatusData;

        if (
            rawPlayerData.player.lastLogin
            && rawPlayerData.player.lastLogout
            && rawPlayerData.player.lastLogin > rawPlayerData.player.lastLogout
        ) {
            const statusURL = new URL(Options.urlHypixelStatus);
            statusURL.search = playerURL.search;

            rawStatusData = (await this.request(statusURL)) as RawHypixelStatus;

            this.lastUserFetches += 1;
        }

        const data = {
            ...ModuleData.cleanPlayerData(rawPlayerData),
            ...ModuleData.cleanStatusData(rawStatusData),
        };

        const changes = await ModuleData.parse(user, data);

        return { changes: changes, data: data };
    }

    public static async handleDataChanges(
        changes: Changes,
        modules: Collection<string, Module<ModuleOptions>>,
        user: User,
    ) {
        const embeds: BetterEmbed[] = [];

        const requiresOnlineAPI = modules.find((module) => module.requireOnlineStatusAPI);

        if (requiresOnlineAPI) {
            if (ModuleData.isOnlineAPIMissing(changes)) {
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
                    `${this.constructor.name}:`,
                    'Missing Online Status API data.',
                );
            } else if (ModuleData.isOnlineAPIReceived(changes)) {
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
                    `${this.constructor.name}:`,
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

    private async request(url: URL) {
        const response = await new Request({
            restRequestTimeout: this.container.config.restRequestTimeout,
            retryLimit: this.container.config.retryLimit,
        }).request(url.toString(), {
            headers: { 'API-Key': process.env.HYPIXEL_API_KEY! },
        });

        this.fetches += 1;

        return response.json() as Promise<HypixelAPIOk>;
    }

    private static changes(newData: CleanHypixelData, oldData: CleanHypixelData) {
        const newDataChanges: PartialCleanHypixelData = {};
        const oldDataChanges: PartialCleanHypixelData = {};

        const combined = { ...newData, ...oldData };

        Object.keys(combined).forEach((rawKey) => {
            const key = rawKey as keyof CleanHypixelData;
            const newValue = newData[key];
            const oldValue = oldData[key];

            if (newValue !== oldValue) {
                // Typescript cannot understand that the same key will yield the same type
                // This seems to be the alternative to get good typings on the output

                // @ts-ignore
                newDataChanges[key] = newValue;
                // @ts-ignore
                oldDataChanges[key] = oldValue;
            }
        });

        return {
            new: newDataChanges,
            old: oldDataChanges,
        };
    }

    private static cleanPlayerData({
        player: {
            firstLogin = null,
            lastLogin = null,
            lastLogout = null,
            mcVersionRp = null,
            userLanguage = 'ENGLISH',
            lastClaimedReward = null,
            rewardScore = null,
            rewardHighScore = null,
            totalDailyRewards = null,
            totalRewards = null,
        },
    }: RawHypixelPlayer): CleanHypixelPlayer {
        return {
            firstLogin: firstLogin,
            lastLogin: lastLogin,
            lastLogout: lastLogout,
            version: mcVersionRp,
            language: userLanguage,
            lastClaimedReward: lastClaimedReward,
            rewardScore: rewardScore,
            rewardHighScore: rewardHighScore,
            totalDailyRewards: totalDailyRewards,
            totalRewards: totalRewards,
        };
    }

    private static cleanStatusData(rawHypixelStatus?: RawHypixelStatus) {
        const { gameType = null, mode = null, map = null } = rawHypixelStatus?.session ?? {};

        return {
            gameType: gameType,
            gameMode: mode,
            gameMap: map,
        } as CleanHypixelStatus;
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

        const changes = ModuleData.changes(newData, oldData);

        this.container.logger.debug(`${this.constructor.name}:`, 'Parsed data:', changes);

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
