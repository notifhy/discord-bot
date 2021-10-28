export interface User {
  discordID: string;
  uuid: string;
  firstLogin: number;
  lastLogin: number;
  lastLogout: number;
  version: string;
  language: string;
}