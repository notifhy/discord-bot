import type { FriendModule, UserAPIData, UserData } from '../@types/database';
import { HypixelPlayerData, SanitizedHypixelPlayerData } from '../@types/hypixel';
import { SQLiteWrapper } from '../database';

export const properties = {
  name: 'friendsEvent',
};

export const execute = async ({
  discordID,
  date,
  hypixelPlayerData,
  oldUserAPIData,
}: {
  discordID: string,
  date: number,
  hypixelPlayerData: SanitizedHypixelPlayerData
  oldUserAPIData: UserAPIData,
}): Promise<void> => {
  if (hypixelPlayerData.lastLogin === oldUserAPIData.lastLogin && hypixelPlayerData.lastLogout === oldUserAPIData.lastLogout) return;

  const historyUpdate: FriendModule = {
    date: date,
  };

  for (const key in hypixelPlayerData) {
    if (Object.prototype.hasOwnProperty.call(hypixelPlayerData, key) === true) {
      if (hypixelPlayerData[key as keyof SanitizedHypixelPlayerData] !== oldUserAPIData[key as keyof UserAPIData]) {
        historyUpdate[key as keyof FriendModule] = hypixelPlayerData[key as keyof SanitizedHypixelPlayerData] as number;
      }
    }
  }

  const newHistory = JSON.parse(oldUserAPIData.friendHistory) as FriendModule[];
    newHistory.splice(50);
    newHistory.splice(0, 0, historyUpdate);

  await SQLiteWrapper.updateUser({
    discordID: discordID,
    table: 'api',
    data: {
      friendHistory: JSON.stringify(newHistory),
    },
  });
};