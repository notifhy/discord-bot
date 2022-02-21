import type {
    CleanHypixelPlayer,
    CleanHypixelStatus,
    RawHypixelPlayer,
    RawHypixelStatus,
} from '../@types/hypixel';
import type { UserAPIData } from '../@types/database';
import { Constants } from '../utility/Constants';
import { GlobalConstants } from '../../utility/Constants';
import { HypixelRequest } from '../../utility/HypixelRequest';

export type Performance = {
    start: number;
    uses: number;
    total: number; //Sum of the rest below
    fetch: number; //Hypixel API fetch
    process: number; //Processing & saving data
    modules: number; //Executing module(s)
}

export class RequestManager {
    restRequestTimeout: number;
    keyPercentage: number;
    retryLimit: number;
    uses: number;

    readonly baseURL: string;

    performance: {
        latest: Performance | null;
        history: Performance[];
    };

    hypixelRequest: HypixelRequest;

    constructor() {
        const { request } = GlobalConstants.defaults;

        this.keyPercentage = 0.9;
        this.restRequestTimeout = request.restRequestTimeout;
        this.retryLimit = request.retryLimit;
        this.uses = 0;

        this.baseURL = `${Constants.urls.hypixel}%{type}%?uuid=%{uuid}%`;

        this.performance = {
            latest: null,
            history: [],
        };

        this.hypixelRequest = new HypixelRequest(this);
    }

    async request(user: UserAPIData, urls: string[]) {
        const [player, status] =
            await Promise.all(
                urls.map(url => this.hypixelRequest.call(url)),
            );

        return {
            player: RequestManager
                .cleanPlayerData(user, player as RawHypixelPlayer),
            status: RequestManager
                .cleanStatusData(status as RawHypixelStatus),
        };
    }

    getURLs(user: UserAPIData) {
        const { uuid, lastLogin, lastLogout } = user;

        const urls = [];
        const playerURL = this.baseURL.replace('%{type}%', 'player');
        const statusURL = this.baseURL.replace('%{type}%', 'status');

        urls.push(playerURL);

        if (lastLogin && lastLogout && lastLogin > lastLogout) {
            urls.push(statusURL);
        }

        urls.forEach(() => {
            this.uses += 1;
        });

        return urls.map(url => url.replace('%{uuid}%', uuid));
    }

    private static cleanPlayerData(
        user: UserAPIData,
        {
            player: {
                firstLogin = null,
                lastLogin = null,
                lastLogout = null,
                mcVersionRp = null,
                userLanguage = user.language ?? 'ENGLISH',
                lastClaimedReward = null,
                rewardScore = null,
                rewardHighScore = null,
                totalDailyRewards = null,
                totalRewards = null,
            },
        }: RawHypixelPlayer,
    ): CleanHypixelPlayer {
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
        if (typeof rawHypixelStatus === 'undefined') {
            return undefined;
        }

        const {
            gameType = null,
            mode = null,
            map = null,
        } = rawHypixelStatus.session;

        return {
            gameType: gameType,
            gameMode: mode,
            gameMap: map,
        } as CleanHypixelStatus;
    }
}