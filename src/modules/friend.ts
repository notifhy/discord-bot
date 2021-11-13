import type { FriendModule, HistoryData, UserAPIData, UserData } from '../@types/database';
import { CleanHypixelPlayerData } from '../@types/hypixel';
import { SQLiteWrapper } from '../database';

export const properties = {
  name: 'friendsEvent',
};

export const execute = async ({
  date,
  discordID,
  differences,
  hypixelPlayerData,
}: {
  date: number,
  differences: HistoryData,
  discordID: string,
  hypixelPlayerData: CleanHypixelPlayerData
}): Promise<void> => {
  //if (hypixelPlayerData.lastLogin === oldUserAPIData.lastLogin && hypixelPlayerData.lastLogout === oldUserAPIData.lastLogout) return;
};