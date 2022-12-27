import { setTimeout } from 'node:timers/promises';
import { RateLimitManager } from '@sapphire/ratelimits';
import type { users as User } from '@prisma/client';
import type {
    CleanHypixelData,
    CleanHypixelPlayer,
    CleanHypixelStatus,
    HypixelAPIOk,
    RawHypixelPlayer,
    RawHypixelStatus,
} from '../@types/Hypixel';
import { Base } from './Base';
import { Time } from '../enums/Time';
import { Request } from './Request';
import { Options } from '../utility/Options';

type PartialCleanHypixelData = Partial<CleanHypixelData>;

export type Changes = {
    new: PartialCleanHypixelData;
    old: PartialCleanHypixelData;
};

export class Hypixel extends Base {
    private rateLimitManager: RateLimitManager;

    private fetches: number;

    public constructor() {
        super();

        this.fetches = 0;
        this.rateLimitManager = new RateLimitManager(
            Time.Minute,
            this.container.config.hypixelRequestBucket,
        );
    }

    public async fetch(user: User) {
        const data = {
            ...(await this.player(user)),
            ...Hypixel.cleanStatusData(),
        };

        if (data.lastLogin && data.lastLogout && data.lastLogin > data.lastLogout) {
            Object.assign(data, await this.status(user));
        }

        const changes = await Hypixel.parse(user, data);

        return { changes: changes, data: data };
    }

    private async player(user: User): Promise<CleanHypixelPlayer> {
        const url = new URL(Options.urlHypixelPlayer);
        url.searchParams.append('uuid', user.uuid);

        const rawData = (await this.container.hypixel.request(url)) as RawHypixelPlayer;
        return Hypixel.cleanPlayerData(rawData);
    }

    private async status(user: User): Promise<CleanHypixelStatus> {
        const url = new URL(Options.urlHypixelStatus);
        url.searchParams.append('uuid', user.uuid);

        const rawData = (await this.container.hypixel.request(url)) as RawHypixelStatus;
        return Hypixel.cleanStatusData(rawData);
    }

    private async request(rawURL: URL): Promise<HypixelAPIOk> {
        const rateLimit = this.rateLimitManager.acquire('global');

        const url = rawURL.toString();

        if (rateLimit.limited) {
            await setTimeout(rateLimit.remainingTime);

            this.container.logger.warn(
                this,
                `Rate limited for ${rateLimit.remainingTime}ms on route ${url}.`,
            );

            // May be an infinite loop, room for improvement with a limit?
            return this.request(rawURL);
        }

        this.container.logger.debug(
            this,
            `Request on route ${url}.`,
        );

        const response = await Request.request(url, {
            headers: { 'API-Key': process.env.HYPIXEL_API_KEY! },
        });

        this.fetches += 1;

        return response.json() as Promise<HypixelAPIOk>;
    }

    public getFetches() {
        return this.fetches;
    }

    public updateBucket() {
        this.rateLimitManager = new RateLimitManager(
            Time.Minute,
            this.container.config.hypixelRequestBucket,
        );
    }

    public static changes(newData: CleanHypixelData, oldData: CleanHypixelData) {
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

        this.container.logger.debug(this, 'Parsed data:', changes);

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
