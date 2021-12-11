/*
Hypixel
*/

export interface BaseHypixelAPI {
    success: boolean;
}

export interface Hypixel400_403_422 extends BaseHypixelAPI {
    cause: string;
}

export interface Hypixel429 extends BaseHypixelAPI {
    cause: string;
    throttle: boolean;
    global: boolean;
}

export interface RawHypixelPlayer extends BaseHypixelAPI {
    player: {
        firstLogin: number | null | undefined;
        lastLogin: number | null | undefined;
        lastLogout: number | null | undefined;
        mcVersionRp: string | null | undefined;
        userLanguage: string | null | undefined;
        lastClaimedReward: number | null | undefined;
        rewardScore: number | null | undefined;
        rewardHighScore: number | null | undefined;
        totalDailyRewards: number | null | undefined;
        totalRewards: number | null | undefined;
    };
}

export interface RawHypixelStatus extends BaseHypixelAPI {
    session: {
        gameType: string | null | undefined;
    };
}

export type HypixelAPIError = Hypixel400_403_422 | Hypixel429;

export type HypixelAPIOk = RawHypixelPlayer | RawHypixelStatus;

export interface CleanHypixelPlayer {
    firstLogin: number | null;
    lastLogin: number | null;
    lastLogout: number | null;
    version: string | null;
    language: string | null;
    lastClaimedReward: number | null;
    rewardScore: number | null;
    rewardHighScore: number | null;
    totalDailyRewards: number | null;
    totalRewards: number | null;
}

export interface CleanHypixelStatus
    extends Required<RawHypixelStatus['session']> {}

/*
Slothpixel
*/

interface Rewards {
    streak_current: number;
    streak_best: number;
    claimed_daily: number;
    claimed: number;
}

interface Links {
    TWITTER: string | null;
    YOUTUBE: string | null;
    INSTAGRAM: string | null;
    TWITCH: string | null;
    DISCORD: string | null;
    HYPIXEL: string | null;
}

export interface Slothpixel {
    uuid: string;
    mc_version: string | null;
    first_login: number | null;
    last_login: number | null;
    last_logout: number | null;
    last_game: string | null;
    language: string | null;
    rewards: Rewards;
    links: Links;
}
