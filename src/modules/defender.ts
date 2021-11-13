import { HistoryData, UserData } from '../@types/database';
import { SQLiteWrapper } from '../database';
import { SanitizedHypixelPlayerData } from '../@types/hypixel';

export const properties = {
  name: 'defenderEvent',
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
  hypixelPlayerData: SanitizedHypixelPlayerData
}): Promise<void> => {
  const userData: UserData = await SQLiteWrapper.getUser({
    discordID: discordID,
    table: 'users',
    columns: ['language'],
    allowUndefined: false,
  }) as UserData;
};