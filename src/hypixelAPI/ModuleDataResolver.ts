import { Client } from 'discord.js';
import { UserAPIData } from '../@types/database';
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
        if (user.modules) {
          if (this.client.config.enabled === true && this.areFatalIssues() === false) {
            (async () => {
              try {
                const url = this.instance.baseURL.replace(/%{uuid}%/, user.uuid);
                const hypixelPlayerData: SanitizedHypixelPlayerData = this.sanitizeData(await this.hypixelRequestCall.call(url, this), user);
                const oldUserAPIData: UserAPIData = await SQLiteWrapper.getUser({
                  discordID: user.discordID,
                  table: 'api',
                  columns: ['*'],
                }) as UserAPIData;

                const payLoad = {
                  discordID: user.discordID,
                  date: Date.now(),
                  hypixelPlayerData: hypixelPlayerData,
                  oldUserAPIData: oldUserAPIData,
                };

                await SQLiteWrapper.updateUser({
                  discordID: user.discordID,
                  table: 'api',
                  data: Object.assign({ lastUpdated: payLoad.date }, hypixelPlayerData),
                });

                const modules = []; //Not really worth using a loop here
                //if (user.modules?.includes('defender')) modules.push(defenderModule.execute(payLoad));
                if (user.modules?.includes('friend')) modules.push(friendModule.execute(payLoad));
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
    const unusualErrors = this.unusual.unusualErrorsLastMinute;
    const abortErrors = this.abort.abortsLastMinute;
    const timeoutExpired = Date.now() > this.instance.resumeAfter;
    return Boolean(unusualErrors > 1 || abortErrors > 1 || timeoutExpired === false);
  }
}