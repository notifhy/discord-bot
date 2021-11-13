export interface BaseUserData {
  discordID: string;
}

export interface HistoryData {
  firstLogin?: number;
  lastLogin?: number;
  lastLogout?: number;
  version?: string;
  language?: string;
  mostRecentGameType?: string;
  lastClaimedReward?: number;
  rewardScore?: number;
  rewardHighScore?: number;
  totalRewards?: number;
  totalDailyRewards?: number;
}

export interface History extends HistoryData {
  date: number;
}

export interface RawConfig {
  baseURL: string;
  blockedUsers: string;
  devMode: number;
  enabled: number;
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

export interface UserDataUpdate extends Partial<UserData> {}
export interface UserAPIDataUpdate extends Partial<UserAPIData> {}

/*
Module Specifics
*/
export interface FriendModule extends BaseUserData {
  enabled: number;
  channel: string;
}

export interface FriendModuleUpdate extends Partial<FriendModule> {}