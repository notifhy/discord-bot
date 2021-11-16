import type { FriendModule, UserAPIData, UserData } from '../@types/database';
import { CleanHypixelPlayerData } from '../@types/hypixel';
import { SQLiteWrapper } from '../database';

export const properties = {
  name: 'defenderEvent',
};

export const execute = async ({
  differences,
  userAPIData,
}: {
  differences: Partial<CleanHypixelPlayerData>,
  userAPIData: UserAPIData
}): Promise<void> => {
  const friendModule = await SQLiteWrapper.getUser<FriendModule, FriendModule>({
    discordID: userAPIData.discordID,
    table: 'friend',
    allowUndefined: false,
    columns: ['enabled', 'channel'],
  }) as FriendModule;

  if (friendModule.enabled === false) return;
  console.log('placeholder');
};