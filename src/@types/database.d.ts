interface HistoryProperties {
  date: number;
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

export interface DatabaseConfig {
  baseURL: string;
  blockedUsers: string;
  devMode: number;
  enabled: number;
  uses: number;
}

export interface RawUserData {
  discordID: string;
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
  mostRecentGameType: string | null;
  lastClaimedReward: number | null;
  rewardScore: number | null;
  rewardHighScore: number | null;
  totalRewards: number | null;
  totalDailyRewards: number | null;
  history: string;
}

export interface UserData {
  discordID: string;
  language: string;
}

export interface UserAPIData {
  discordID: string;
  uuid: string;
  modules: string | null;
  lastUpdated: number;
  firstLogin: number | null;
  lastLogin: number | null;
  lastLogout: number | null;
  version: string | null;
  language: string | null;
  mostRecentGameType: string | null;
  lastClaimedReward: number | null;
  rewardScore: number | null;
  rewardHighScore: number | null;
  totalRewards: number | null;
  totalDailyRewards: number | null;
  history: HistoryProperties[];
}

export interface UserDataUpdate extends Partial<UserData> {}
export interface UserAPIDataUpdate extends Partial<UserAPIData> {}

export interface FriendModule {
  date: number;
  lastLogin?: number | null;
  lastLogout?: number | null;
}