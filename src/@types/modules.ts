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

export interface ModuleEvents {
  properties: {
    name: string;
  }
  execute(discordID: string, date: number, data: UserAPIData): Promise<void>;
}