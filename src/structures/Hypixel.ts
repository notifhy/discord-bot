import { setTimeout } from 'node:timers/promises';
import { RateLimitManager } from '@sapphire/ratelimits';
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

    public async request(url: string): Promise<HypixelAPIOk> {
        const rateLimit = this.rateLimitManager.acquire('global');

        if (rateLimit.limited) {
            await setTimeout(rateLimit.remainingTime);

            this.container.logger.warn(
                `${this.constructor.name}:`,
                `Rate limited for ${rateLimit.remainingTime}ms on route ${url}.`,
            );

            // May be an infinite loop, room for improvement with a limit?
            return this.request(url);
        }

        this.container.logger.debug(
            `${this.constructor.name}:`,
            `Request to Hypixel on route ${url}.`,
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

    public static cleanPlayerData({
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

    public static cleanStatusData(rawHypixelStatus?: RawHypixelStatus) {
        const { gameType = null, mode = null, map = null } = rawHypixelStatus?.session ?? {};

        return {
            gameType: gameType,
            gameMode: mode,
            gameMap: map,
        } as CleanHypixelStatus;
    }
}
