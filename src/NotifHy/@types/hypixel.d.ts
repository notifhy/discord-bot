/*
Hypixel
*/
export interface BaseHypixelAPI {
    success: boolean,
}

export interface Hypixel400_403_422 extends BaseHypixelAPI {
    cause: string,
}

export interface Hypixel429 extends BaseHypixelAPI {
    cause: string,
    throttle: boolean,
    global: boolean,
}

export interface RawHypixelPlayer extends BaseHypixelAPI {
    player: {
        firstLogin: number | null | undefined,
        lastLogin: number | null | undefined,
        lastLogout: number | null | undefined,
        mcVersionRp: string | null | undefined,
        userLanguage: string | null | undefined,
        lastClaimedReward: number | null | undefined,
        rewardScore: number | null | undefined,
        rewardHighScore: number | null | undefined,
        totalDailyRewards: number | null | undefined,
        totalRewards: number | null | undefined,
    },
}

export interface RawHypixelStatus extends BaseHypixelAPI {
    session: {
        gameType: string | null | undefined,
        mode: string | null | undefined,
        map: string | null | undefined,
    },
}

export type HypixelAPIError =
    | Hypixel400_403_422
    | Hypixel429;

export type HypixelAPIOk =
    | RawHypixelPlayer
    | RawHypixelStatus;

export interface CleanHypixelPlayer {
    firstLogin: number | null,
    lastLogin: number | null,
    lastLogout: number | null,
    version: string | null,
    language: string | null,
    lastClaimedReward: number | null,
    rewardScore: number | null,
    rewardHighScore: number | null,
    totalDailyRewards: number | null,
    totalRewards: number | null,
}

export interface CleanHypixelStatus {
    gameType: string | null,
    gameMode: string | null,
    gameMap: string | null,
}

/*
Slothpixel
*/
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
}[]

export interface SlothpixelStatus {
    online: boolean,
    game: {
        type: string | null,
        mode: string | null,
        map: string | null,
    },
}


/*
Player DB
*/
export interface PlayerDB {
    code: string,
    message: string,
    success: boolean,
    data: {
        player: {
            meta: {
                name_history: string[],
            }
            username: string,
            id: string,
            raw_id: string,
            avatar: string,
        },
    },
}