import { UserAPIData, UserData, ValidAPIUserUpdate } from '../@types/database';
import type { EventProperties } from '../@types/index';
import { SQLiteWrapper } from '../database';
import { formattedUnix } from '../util/utility';

export const properties = {
  name: 'defenderEvent',
};

export const execute = async (discordID: string, date: number, data: ValidAPIUserUpdate): Promise<void> => {
  const userAPIData: UserAPIData = await SQLiteWrapper.getUser({
    discordID: discordID,
    table: 'api',
    columns: ['lastLogin', 'lastLogout'],
  }) as UserAPIData;

  const userData: UserData = await SQLiteWrapper.getUser({
    discordID: discordID,
    table: 'users',
    columns: ['language'],
  }) as UserData;
};