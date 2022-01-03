import type {
    CleanHypixelPlayer,
    CleanHypixelStatus,
} from './hypixel';
import type { Field } from './locales';

export type Tables = 'users' | 'api' | 'friends' | 'rewards';

export interface BaseUserData {
    discordID: string;
}

export interface History extends Partial<CleanHypixelPlayer> {
    date: number;
}

export interface UserData extends BaseUserData {
    language: string;
    systemMessages: Field[];
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

export interface FriendsModule extends BaseUserData {
    channel: string | null;
}

export interface RewardsModule extends BaseUserData {
    alertTime: number | null;
    claimNotification: boolean;
    lastNotified: number;
    milestones: boolean;
    notificationInterval: number;
}
