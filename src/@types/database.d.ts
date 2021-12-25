import type { CleanHypixelPlayer, CleanHypixelStatus } from './hypixel';

export type Tables = 'users' | 'api' | 'friends' | 'rewards';

export interface BaseUserData {
    discordID: string;
}

export interface History extends Partial<CleanHypixelPlayer> {
    date: number;
}

export interface RawConfig {
    blockedGuilds: string;
    blockedUsers: string;
    devMode: string;
    enabled: string;
    uses: number;
}

export interface RawUserData extends BaseUserData {
    language: string;
    systemMessage: string | null;
}

export interface RawUserAPIData extends BaseUserData, CleanHypixelPlayer {
    uuid: string;
    modules: string;
    lastUpdated: number;
    history: string;
}

export interface UserData extends BaseUserData {
    language: string;
    systemMessage: string | null;
}

export interface UserAPIData
    extends BaseUserData,
        CleanHypixelPlayer,
        CleanHypixelStatus {
    uuid: string;
    modules: string[];
    lastUpdated: number;
    history: History[];
}

/*
Module Specifics
*/
export interface RawFriendsModule extends BaseUserData {
    channel: string | null;
    suppressNext: string;
}

export interface FriendsModule extends BaseUserData {
    channel: string | null;
    suppressNext: boolean;
}

export interface RawRewardsModule extends BaseUserData {
    alertTime: number | null;
    claimNotification: string;
    lastNotified: number;
    milestones: string;
    notificationInterval: number;
}

export interface RewardsModule extends BaseUserData {
    alertTime: number | null;
    claimNotification: boolean;
    lastNotified: number;
    milestones: boolean;
    notificationInterval: number;
}
