import type {
    CleanHypixelPlayer,
    CleanHypixelStatus,
    RawHypixelPlayer,
    RawHypixelStatus,
} from '../@types/hypixel';
import type { RequestInstance } from './RequestInstance';
import type { UserAPIData } from '../@types/database';
import { HypixelRequest } from '../util/HypixelRequest';

export class RequestRequest extends HypixelRequest {
    readonly instance: RequestInstance;

    constructor(instance: RequestInstance) {
        super(instance);
        this.instance = instance;
    }

    generateURLS(user: UserAPIData) {
        const urls: string[] = [
            this.instance.baseURL.replace(/%{type}%/, 'player'),
        ];

        if (Number(user.lastLogin) > Number(user.lastLogout)) { //If the user is online
            urls.push(this.instance.baseURL.replace(/%{type}%/, 'status'));
        }

        return urls.map(url => url.replace(/%{uuid}%/, user.uuid));
    }

    async executeRequest(
        user: UserAPIData,
        urls: string[],
    ): Promise<{
        cleanHypixelPlayer: CleanHypixelPlayer,
        cleanHypixelStatus: CleanHypixelStatus | undefined,
    }> {
        urls.forEach(() => {
            this.instance.instanceUses += 1;
        });

        const hypixelAPIOk = await Promise.all(
            urls.map(url =>
                this.call(url),
            ),
        );

        const hypixelPlayerData: CleanHypixelPlayer =
            RequestRequest.cleanPlayerData(
                user,
                hypixelAPIOk[0] as RawHypixelPlayer,
            );

        const hypixelStatusData: CleanHypixelStatus | undefined =
            RequestRequest.cleanStatusData(
                hypixelAPIOk[1] as RawHypixelStatus | undefined,
            );

        return {
            cleanHypixelPlayer: hypixelPlayerData,
            cleanHypixelStatus: hypixelStatusData,
        };
    }

    static cleanPlayerData(
        userAPIData: UserAPIData,
        {
            player: {
                firstLogin = null,
                lastLogin = null,
                lastLogout = null,
                mcVersionRp = null,
                userLanguage = userAPIData.language ?? 'ENGLISH',
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

    static cleanStatusData(rawHypixelStatus?: RawHypixelStatus) {
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
