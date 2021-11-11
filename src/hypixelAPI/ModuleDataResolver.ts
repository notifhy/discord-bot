import { Client } from 'discord.js';
import { History, HistoryData, UserAPIData } from '../@types/database';
import { HypixelPlayerData, SanitizedHypixelPlayerData } from '../@types/hypixel';
import { SQLiteWrapper } from '../database';
import { timeout } from '../util/utility';
import { keyLimit } from '../../config.json';
import { Abort, Instance, RateLimit, Unusual } from './HypixelRequestHelper';
import { HypixelRequestCall } from './HypixelRequestCall';
import * as friendModule from '../modules/friend';
import * as defenderModule from '../modules/defender';
import errorHandler from '../util/error/errorHandler';

export class ModuleDataResolver {
  [key: string]: any; //Not ideal, but I couldn't get anything else to work
  abort: Abort;
  client: Client;
  hypixelRequestCall: HypixelRequestCall;
  instance: Instance;
  rateLimit: RateLimit;
  unusual: Unusual;

  constructor(client: Client) {
    this.abort = new Abort();
    this.client = client;
    this.hypixelRequestCall = new HypixelRequestCall();
    this.instance = new Instance();
    this.rateLimit = new RateLimit();
    this.unusual = new Unusual();
  }

  async cycle() {
    try {
      if (this.instance.resumeAfter > Date.now()) {
        await timeout(this.instance.resumeAfter - Date.now());
      }

      const users = await SQLiteWrapper.getAllUsers({
        table: 'api',
        columns: ['discordID', 'uuid', 'modules'],
      }) as UserAPIData[];

      const keyQueryLimit = keyLimit * this.instance.keyPercentage;
      const intervalBetweenRequests = 60 / keyQueryLimit * 1000;

      for (const user of users) {
        if (user.modules.length > 0) {
          if (this.areFatalIssues() === false) {
            (async () => {
              try {
                const url = this.instance.baseURL.replace(/%{uuid}%/, user.uuid);
                const hypixelPlayerData: SanitizedHypixelPlayerData = this.sanitizeData(await this.hypixelRequestCall.call(url, this), user);
                const now = Date.now();

                const oldUserAPIData = await SQLiteWrapper.getUser({
                  discordID: user.discordID,
                  table: 'api',
                  columns: ['*'],
                }) as UserAPIData;

                const differences: HistoryData = {};

                for (const key in hypixelPlayerData) {
                  if (Object.prototype.hasOwnProperty.call(hypixelPlayerData, key) === true) {
                    if (hypixelPlayerData[key as keyof SanitizedHypixelPlayerData] !== oldUserAPIData[key as keyof UserAPIData]) {
                      (differences[key as keyof HistoryData] as unknown) = hypixelPlayerData[key as keyof SanitizedHypixelPlayerData];
                    }
                  }
                }

                const payLoad = {
                  date: now,
                  differences: differences,
                  discordID: user.discordID,
                  hypixelPlayerData: hypixelPlayerData,
                };

                await this.updateDatabase({
                  differences,
                  hypixelPlayerData,
                  now,
                  oldUserAPIData,
                  user,
                });

                const modules = []; //Not really worth using a loop here
                //if (user.modules?.includes('defender')) modules.push(defenderModule.execute(payLoad));
                if (user.modules.includes('friend')) modules.push(friendModule.execute(payLoad));
                await Promise.all(modules);
              } catch (error) {
                await errorHandler({ error: error, moduleDataResolver: this });
              }
            })();
          }
          await timeout(intervalBetweenRequests); //eslint-disable-line no-await-in-loop
        }
      }
    } catch (error) {
      await errorHandler({ error: error, moduleDataResolver: this });
    }
  }

  private async updateDatabase({
    differences,
    hypixelPlayerData,
    now,
    oldUserAPIData,
    user,
  }: {
    differences: HistoryData,
    hypixelPlayerData: SanitizedHypixelPlayerData,
    now: number,
    oldUserAPIData: UserAPIData,
    user: UserAPIData
  }) {
    const newUserAPIData = Object.assign({ lastUpdated: now }, hypixelPlayerData);

    if (Object.keys(differences).length > 0) {
      const historyUpdate: History = Object.assign({ date: now }, differences);
      const history: History[] = oldUserAPIData.history;
      history.unshift(historyUpdate);
      history.splice(100);
      Object.assign(newUserAPIData, { history: history });
    }

    await SQLiteWrapper.updateUser({
      discordID: user.discordID,
      table: 'api',
      data: newUserAPIData,
    });
  }

  private sanitizeData(hypixelPlayerData: HypixelPlayerData, userAPIData: UserAPIData) {
    return {
      firstLogin: hypixelPlayerData.firstLogin ?? null,
      lastLogin: hypixelPlayerData.lastLogin ?? null,
      lastLogout: hypixelPlayerData.lastLogout ?? null,
      version: hypixelPlayerData.mcVersionRp ?? userAPIData.version ?? null,
      language: hypixelPlayerData.userLanguage ?? userAPIData.language ?? 'ENGLISH',
      mostRecentGameType: hypixelPlayerData.mostRecentGameType ?? null,
      lastClaimedReward: hypixelPlayerData.lastClaimedReward ?? null,
      rewardScore: hypixelPlayerData.rewardScore ?? null,
      rewardHighScore: hypixelPlayerData.rewardHighScore ?? null,
      totalDailyRewards: hypixelPlayerData.totalDailyRewards ?? null,
      totalRewards: hypixelPlayerData.totalRewards ?? null,
    } as SanitizedHypixelPlayerData;
  }

  areFatalIssues(): boolean { //Could be expanded
    const enabled = this.client.config.enabled === true;
    const unusualErrors = this.unusual.unusualErrorsLastMinute;
    const abortErrors = this.abort.abortsLastMinute;
    const timeoutExpired = Date.now() > this.instance.resumeAfter;
    return Boolean(enabled === false || unusualErrors > 1 || abortErrors > 1 || timeoutExpired === false);
  }
}