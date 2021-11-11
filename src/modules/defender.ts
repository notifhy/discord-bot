import { UserAPIData, UserAPIDataUpdate, UserData } from '../@types/database';
import { SQLiteWrapper } from '../database';
import { SanitizedHypixelPlayerData } from '../@types/hypixel';

export const properties = {
  name: 'defenderEvent',
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
  const userData: UserData = await SQLiteWrapper.getUser({
    discordID: discordID,
    table: 'users',
    columns: ['language'],
  }) as UserData;
};