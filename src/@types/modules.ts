import type { CleanHypixelPlayerData } from './hypixel';
import type { Client } from 'discord.js';
import type { UserAPIData } from './database';

export type ModuleNames =
  | 'defender'
  | 'friend'
  | 'rewards'

export type Differences = {
  primary: Partial<CleanHypixelPlayerData>,
  secondary: Partial<UserAPIData>,
};

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

export interface ClientModule {
  properties: {
    name: string;
  }
  execute({
    client,
    differences,
    userAPIData,
  }: {
    client: Client,
    differences: Differences,
    userAPIData: UserAPIData,
  }): Promise<void>;
}