export interface UserData {
  discordID: string;
  language: string;
  modules: string;
}

export interface UserAPIData {
  discordID: string;
  uuid: string;
  urls: string;
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
  totalDailyRewards: number | null;
}

export interface ValidUserUpdate {
  discordID?: string;
  language?: string | null;
  modules?: string | null;
}

export interface ValidAPIUserUpdate { //no idea how to simplify, ill do this later
  discordID?: string;
  uuid?: string;
  urls?: string | null;
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
  totalDailyRewards?: number | null | undefined;
}