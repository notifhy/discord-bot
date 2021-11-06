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
  daily: AssetModule;
}