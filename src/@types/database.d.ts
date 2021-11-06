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
}

export interface ValidUserUpdate {
  discordID?: string;
  language?: string | null;
  modules?: string | null;
}

export interface ValidAPIUserUpdate {
  discordID?: string;
  uuid?: string;
  urls?: string | null;
  lastUpdated?: number;
  firstLogin?: number | null;
  lastLogin?: number | null;
  lastLogout?: number | null;
  version?: string | null;
  language?: string | null;
}