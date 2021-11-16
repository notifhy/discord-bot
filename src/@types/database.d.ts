import type { CleanHypixelPlayerData, CleanHypixelStatusData } from './hypixel';

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

export interface RawUserAPIData extends CleanHypixelPlayerData {
  discordID: string;
  uuid: string;
  modules: string;
  lastUpdated: number;
  history: string;
}

export interface UserData extends BaseUserData {
  language: string;
}

export interface UserAPIData extends BaseUserData, CleanHypixelPlayerData, CleanHypixelStatusData {
  uuid: string;
  modules: string[];
  lastUpdated: number;
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