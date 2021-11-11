import { UserAPIData } from './database';

export interface AssetModule {
  [key: string]: string;
  label: string,
  description: string;
  longDescription: string;
  value: string;
}

export interface AssetModules {
  [key: string]: AssetModule;
  defender: AssetModule;
  friend: AssetModule;
  rewards: AssetModule;
}

export interface DefenderModuleData {
  firstLogin: number;
  lastLogin: number;
  lastLogout: number;
  version: string;
  language: string;
  mostRecentGameType: string;
}

export interface FriendModuleData {
  firstLogin: number;
  lastLogin: number;
  lastLogout: number;
}

export interface RewardModuleData {
  lastClaimedReward: number;
  rewardScore: number;
  rewardHighScore: number;
  totalDailyRewards: number;
}

export interface ModuleEvents {
  properties: {
    name: string;
  }
  execute(discordID: string, date: number, data: UserAPIData): Promise<void>;
}