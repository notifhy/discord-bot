interface BaseHypixelAPI {
  success: boolean;
}

interface HypixelKeyRecord {
  key: string;
  owner: string;
  limit: number;
  queriesInPastMin: number;
  totalQueries: number;
}

interface HypixelPlayerData {
  firstLogin: number;
  lastLogin: number;
  lastLogout: number;
  version: string;
  language: string;
}

export interface HypixelPlayer extends BaseHypixelAPI {
  player: HypixelPlayerData;
}

export interface HypixelKey extends BaseHypixelAPI {
  record: HypixelKeyRecord;
}

export interface Hypixel400_403_422 extends BaseHypixelAPI {
  cause: string;
}

export interface Hypixel429 extends BaseHypixelAPI {
  cause: string;
  throttle: boolean;
  global: boolean;
}

export interface HypixelAPI extends HypixelPlayer, HypixelKey, Hypixel400_403_422, Hypixel429 {}