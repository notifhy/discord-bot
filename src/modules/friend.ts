import type { FriendModule, HistoryProperties, UserAPIData, UserData } from '../@types/database';
import { HypixelPlayerData, SanitizedHypixelPlayerData } from '../@types/hypixel';
import { SQLiteWrapper } from '../database';

export const properties = {
  name: 'friendsEvent',
};

export const execute = async ({
  discordID,
  date,
  hypixelPlayerData,
}: {
  discordID: string,
  date: number,
  hypixelPlayerData: SanitizedHypixelPlayerData
}): Promise<void> => {
  //if (hypixelPlayerData.lastLogin === oldUserAPIData.lastLogin && hypixelPlayerData.lastLogout === oldUserAPIData.lastLogout) return;
};