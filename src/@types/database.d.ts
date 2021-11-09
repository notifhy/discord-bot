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
  defenderHistory: string;
  friendHistory: string;
  dailyHistory: string;
}

export interface ValidUserUpdate {
  discordID?: string;
  language?: string | null;
}

export interface ValidAPIUserUpdate { //no idea how to simplify, ill do this later
  discordID?: string;
  uuid?: string;
  modules?: string | null;
  lastUpdated?: number;
  firstLogin?: number | null;
  lastLogin?: number | null;
  lastLogout?: number | null;
  version?: string | null;
  language?: string | null;
  mostRecentGameType?: string | null;
  lastClaimedReward?: number | null | undefined;
  rewardScore?: number | null | undefined;
  rewardHighScore?: number | null | undefined;
  totalRewards?: number | null | undefined;
  totalDailyRewards?: number | null | undefined;
  defenderHistory?: string;
  friendHistory?: string;
  dailyHistory?: string;
}

export interface FriendModule {
  date: number;
  lastLogin?: number | null;
  lastLogout?: number | null;
}