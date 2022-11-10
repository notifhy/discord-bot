import { URL } from 'node:url';
import type { users as User } from '@prisma/client';
import { container } from '@sapphire/framework';
import type {
    CleanHypixelData,
    CleanHypixelPlayer,
    CleanHypixelStatus,
    HypixelAPIOk,
    RawHypixelPlayer,
    RawHypixelStatus,
} from '../@types/Hypixel';
import { Base } from '../structures/Base';
import { Request } from '../structures/Request';
import { Options } from '../utility/Options';

export class Requests extends Base {
    public fetches: number;

    public lastUserFetches: number;

    public constructor() {
        super();
        this.fetches = 0;
        this.lastUserFetches = 0;
    }

    public async request(user: User) {
        this.lastUserFetches = 0;

        const playerURL = new URL(Options.urlHypixelPlayer);
        playerURL.searchParams.append('uuid', user.uuid);

        const rawPlayerData = await this.fetch(playerURL) as RawHypixelPlayer;

        this.lastUserFetches += 1;

        let rawStatusData;

        if (
            rawPlayerData.player.lastLogin
            && rawPlayerData.player.lastLogout
            && rawPlayerData.player.lastLogin > rawPlayerData.player.lastLogout
        ) {
            const statusURL = new URL(Options.urlHypixelStatus);
            statusURL.search = playerURL.search;

            rawStatusData = await this.fetch(statusURL) as RawHypixelStatus;

            this.lastUserFetches += 1;
        }

        return {
            ...this.cleanPlayerData(rawPlayerData),
            ...this.cleanStatusData(rawStatusData),
        } as CleanHypixelData;
    }

    private async fetch(url: URL) {
        const response = await new Request({
            restRequestTimeout: container.config.restRequestTimeout,
            retryLimit: container.config.retryLimit,
        }).request(url.toString(), {
            headers: { 'API-Key': process.env.HYPIXEL_API_KEY! },
        });

        this.fetches += 1;

        return response.json() as Promise<HypixelAPIOk>;
    }

    private cleanPlayerData({
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

    private cleanStatusData(rawHypixelStatus?: RawHypixelStatus) {
        const { gameType = null, mode = null, map = null } = rawHypixelStatus?.session ?? {};

        return {
            gameType: gameType,
            gameMode: mode,
            gameMap: map,
        } as CleanHypixelStatus;
    }
}
