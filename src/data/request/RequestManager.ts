import type {
    CleanHypixelPlayer,
    CleanHypixelStatus,
    RawHypixelPlayer,
    RawHypixelStatus,
} from '../../@types/hypixel';
import type { UserAPIData } from '../../@types/database';
import { HypixelRequest } from '../../util/HypixelRequest';
import { Log } from '../../util/Log';
import { RequestErrors } from './RequestErrors';
import Constants from '../../util/Constants';

export type Performance = {
    start: number;
    uses: number;
    total: number; //Sum of the rest below
    fetch: number; //Hypixel API fetch
    process: number; //Processing & saving data
    modules: number; //Executing module(s)
}

export class RequestManager {
    abortThreshold: number;
    keyPercentage: number;
    maxAborts: number;
    resumeAfter: number;
    uses: number;

    readonly baseURL: string;

    performance: {
        latest: Performance | null;
        history: Performance[];
    };

    errors: RequestErrors;

    hypixelRequest: HypixelRequest;

    constructor() {
        this.abortThreshold = 2500;
        this.keyPercentage = 0.6;
        this.maxAborts = 1;
        this.resumeAfter = 0;
        this.uses = 0;

        this.baseURL = `${Constants.urls.hypixel}%{type}%?uuid=%{uuid}%`;

        this.performance = {
            latest: null,
            history: [],
        };

        this.errors = new RequestErrors(this);

        this.hypixelRequest = new HypixelRequest(this);
    }

    async request(user: UserAPIData, urls: string[]) {
        Log.log(user.uuid);

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
        if (rawHypixelStatus === undefined) {
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