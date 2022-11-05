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
    public uses: number;

    public constructor() {
        super();
        this.uses = 0;
    }

    public async request(urls: URL[]) {
        const [player, status] = await Promise.all(
            urls.map((url) => this.fetch(url.toString())),
        );

        return {
            ...this.cleanPlayerData(player as RawHypixelPlayer),
            ...this.cleanStatusData(status as RawHypixelStatus),
        } as CleanHypixelData;
    }

    private async fetch(url: string) {
        const response = await new Request({
            restRequestTimeout: container.config.restRequestTimeout,
            retryLimit: container.config.retryLimit,
        }).request(url, {
            headers: { 'API-Key': process.env.HYPIXEL_API_KEY! },
        });

        return response.json() as Promise<HypixelAPIOk>;
    }

    public async getURLs(user: User) {
        const { uuid } = user;

        const { lastLogin, lastLogout } = (await this.container.database.activities.findFirst({
            orderBy: {
                index: 'desc',
            },
            select: {
                lastLogin: true,
                lastLogout: true,
            },
            where: {
                id: user.id,
            },
        })) ?? {};

        const playerURL = new URL(Options.urlHypixelPlayer);
        playerURL.searchParams.append('uuid', uuid);

        const urls = [];

        urls.push(playerURL);

        if (lastLogin && lastLogout && lastLogin > lastLogout) {
            const statusURL = new URL(Options.urlHypixelStatus);
            statusURL.search = playerURL.search;
            urls.push(statusURL);
        }

        urls.forEach(() => {
            this.uses += 1;
        });

        return urls;
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
