import type { CleanHypixelPlayerData } from './hypixel';

export interface BaseUserData {
  discordID: string;
}

export interface History extends Partial<CleanHypixelPlayerData> {
  date: number;
}

export interface RawConfig {
  baseURL: string;
  blockedUsers: string;
  devMode: string;
  enabled: string;
  uses: number;
}

export interface RawUserData extends BaseUserData {
  language: string;
}

export interface RawUserAPIData {
  discordID: string;
  uuid: string;
  modules: string | null;
  lastUpdated: number;
  firstLogin: number | null;
  lastLogin: number | null;
  lastLogout: number | null;
  version: string | null;
  language: string | null;
  gameType: string | null;
  lastClaimedReward: number | null;
  rewardScore: number | null;
  rewardHighScore: number | null;
  totalRewards: number | null;
  totalDailyRewards: number | null;
  history: string;
}

export interface UserData extends BaseUserData {
  language: string;
}

export interface UserAPIData extends BaseUserData{
  uuid: string;
  modules: string[];
  lastUpdated: number;
  firstLogin: number | null;
  lastLogin: number | null;
  lastLogout: number | null;
  version: string | null;
  language: string | null;
  gameType: string | null;
  lastClaimedReward: number | null;
  rewardScore: number | null;
  rewardHighScore: number | null;
  totalRewards: number | null;
  totalDailyRewards: number | null;
  history: History[];
}

export interface RawUserDataUpdate extends Partial<RawUserData> {}
export interface RawUserAPIDataUpdate extends Partial<RawUserAPIData> {}

export interface UserDataUpdate extends Partial<UserData> {}
export interface UserAPIDataUpdate extends Partial<UserAPIData> {}

/*
Module Specifics
*/
export interface RawFriendModule extends BaseUserData {
  enabled: string;
  channel: string;
}

export interface FriendModule extends BaseUserData {
  enabled: boolean;
  channel: string;
}

export interface RawFriendModuleUpdate extends Partial<RawFriendModule> {}
export interface FriendModuleUpdate extends Partial<FriendModule> {}