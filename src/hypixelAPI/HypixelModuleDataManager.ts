import type { History, RawUserAPIData, UserAPIData } from '../@types/database';
import type { CleanHypixelPlayerData, CleanHypixelStatusData } from '../@types/hypixel';
import type { Differences } from '../@types/modules';
import { SQLiteWrapper } from '../database';
import { compare } from '../util/utility';

export class HypixelModuleDataManager {
  oldUserAPIData: UserAPIData;
  now: number;
  differences: Differences;
  newUserAPIData: UserAPIData;

  constructor({
    oldUserAPIData,
    cleanHypixelPlayerData,
    cleanHypixelStatusData,
  }: {
    oldUserAPIData: UserAPIData,
    cleanHypixelPlayerData: CleanHypixelPlayerData,
    cleanHypixelStatusData: CleanHypixelStatusData | undefined,
  }) {
    const hypixelData = Object.assign(cleanHypixelPlayerData, cleanHypixelStatusData);

    this.oldUserAPIData = oldUserAPIData;
    this.now = Date.now();
    this.differences = compare(hypixelData, this.oldUserAPIData);
    this.newUserAPIData = Object.assign(this.oldUserAPIData, this.differences.primary, { lastUpdated: this.now });
  }

  async updateUserAPIData() {
    const userAPIDataUpdate: Partial<UserAPIData> = Object.assign(this.differences.primary, { lastUpdated: this.now });

    if (Object.keys(this.differences.primary).length > 0) {
      const historyUpdate: History = { date: this.now, ...this.differences.primary };
      const { history }: { history: History[] } = this.oldUserAPIData;
      history.unshift(historyUpdate);
      history.splice(250);
      Object.assign(userAPIDataUpdate, { history: history });
    }

    await SQLiteWrapper.updateUser<Partial<UserAPIData>, RawUserAPIData>({
      discordID: this.oldUserAPIData.discordID,
      table: 'api',
      data: userAPIDataUpdate,
    });
  }
}