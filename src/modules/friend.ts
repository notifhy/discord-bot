import type { FriendModule, UserAPIData, UserData } from '../@types/database';
import { HypixelPlayerData } from '../@types/hypixel';
import { FriendModuleData } from '../@types/modules';
import { SQLiteWrapper } from '../database';

export const properties = {
  name: 'friendsEvent',
};

export const execute = async (discordID: string, date: number, update: HypixelPlayerData): Promise<void> => {
  const userAPIData: UserAPIData = await SQLiteWrapper.getUser({
    discordID: discordID,
    table: 'api',
    columns: ['lastLogin', 'lastLogout', 'friendHistory'],
  }) as UserAPIData;

  if (update.lastLogin === userAPIData.lastLogin && update.lastLogout === userAPIData.lastLogout) return;

  const userData: UserData = await SQLiteWrapper.getUser({
    discordID: discordID,
    table: 'users',
    columns: ['language'],
  }) as UserData;

  const historyUpdate: FriendModule = {
    date: date,
  };

  for (const key in update) {
    if (Object.prototype.hasOwnProperty.call(update, key) === true) {
      if (update[key as keyof HypixelPlayerData] !== userAPIData[key as keyof UserAPIData]) {
        historyUpdate[key as keyof FriendModule] = update[key as keyof HypixelPlayerData] as number;
      }
    }
  }

  const newHistory = (JSON.parse(userAPIData.friendHistory) as FriendModule[]).splice(50).splice(0, 0, historyUpdate);

  await SQLiteWrapper.updateUser({
    discordID: discordID,
    table: 'api',
    data: {
      friendHistory: JSON.stringify(newHistory),
    },
  });
};