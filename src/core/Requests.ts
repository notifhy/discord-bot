import { users as User } from '@prisma/client';
import { URL } from 'node:url';
import {
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

    public async request(user: User) {
        const [player, status] = await Promise.all(
            (await this.getURLs(user)).map(
                (url) => this.handle(url.toString()),
            ),
        );

        return {
            player: this.cleanPlayerData(player as RawHypixelPlayer),
            status: this.cleanStatusData(status as RawHypixelStatus),
        };
    }

    public async handle(url: string) {
        const response = await new Request({
            restRequestTimeout: this.container.config.restRequestTimeout,
            retryLimit: this.container.config.retryLimit,
        }).request(url, {
            headers: { 'API-Key': process.env.HYPIXEL_API_KEY! },
        });

        return response.json() as Promise<HypixelAPIOk>;
    }

    private async getURLs(user: User) {
        const { uuid } = user;

        const {
            lastLogin,
            lastLogout,
        } = await this.container.database.activities.findFirst({
            where: {
                uuid: {
                    equals: uuid,
                },
            },
        }) ?? {};

        const playerURL = new URL(Options.hypixelPlayerURL);
        playerURL.searchParams.append('uuid', uuid);

        const urls = [];

        urls.push(playerURL);

        if (lastLogin && lastLogout && lastLogin > lastLogout) {
            const statusURL = new URL(Options.hypixelStatusURL);
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
        if (typeof rawHypixelStatus === 'undefined') {
            return undefined;
        }

        const { gameType = null, mode = null, map = null } = rawHypixelStatus.session;

        return {
            gameType: gameType,
            gameMode: mode,
            gameMap: map,
        } as CleanHypixelStatus;
    }
}