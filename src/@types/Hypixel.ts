// Hypixel
export interface BaseHypixelAPI {
    success: boolean;
}

export interface HypixelAPIError extends BaseHypixelAPI {
    cause: string;
}

export interface HypixelAPI429 extends BaseHypixelAPI {
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
        online: boolean | null;
        gameType: string | null | undefined;
        mode: string | null | undefined;
        map: string | null | undefined;
    };
}

export type HypixelAPINotOK = HypixelAPIError | HypixelAPI429;

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

export interface CleanHypixelStatus {
    gameType: string | null;
    gameMode: string | null;
    gameMap: string | null;
}

export type CleanHypixelData = CleanHypixelPlayer & CleanHypixelStatus;

// Slothpixel

export interface SlothpixelPlayer {
    uuid: string,
    username: string,
    mc_version: string | null,
    first_login: number | null,
    last_login: number | null,
    last_logout: number | null,
    last_game: string | null,
    language: string | null,
    rewards: {
        streak_current: number,
        streak_best: number,
        claimed_daily: number,
        claimed: number,
    },
    links: {
        TWITTER: string | null,
        YOUTUBE: string | null,
        INSTAGRAM: string | null,
        TWITCH: string | null,
        DISCORD: string | null,
        HYPIXEL: string | null,
    },
}

export type SlothpixelRecentGames = {
    date: number,
    gameType: string,
    mode?: string,
    map?: string,
    ended?: number,
}[];

export interface SlothpixelStatus {
    online: boolean,
    game: {
        type: string | null,
        mode: string | null,
        map: string | null,
    },
}
