import type { Client } from 'discord.js';
import type { History, RawUserAPIData, UserAPIData } from '../@types/database';
import { Abort, Instance, RateLimit, Unusual } from './ModuleRequestHelper';
import { CleanHypixelPlayerData, CleanHypixelStatusData, HypixelAPIOk, RawHypixelPlayer, RawHypixelPlayerData, RawHypixelStatus, RawHypixelStatusData } from '../@types/hypixel';
import { compare } from '../util/utility';
import { HypixelRequestCall } from './HypixelRequestCall';
import { keyLimit } from '../../config.json';
import { setTimeout } from 'timers/promises';
import { SQLiteWrapper } from '../database';
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
    this.instance = new Instance();
    this.rateLimit = new RateLimit();
    this.unusual = new Unusual();

    this.client = client;
    this.hypixelRequestCall = new HypixelRequestCall(this);
  }

  async cycle() {
    try {
      if (this.instance.resumeAfter > Date.now()) {
        await setTimeout(this.instance.resumeAfter - Date.now());
      }

      const users = await SQLiteWrapper.getAllUsers<RawUserAPIData, UserAPIData>({
        table: 'api',
        columns: ['discordID', 'uuid', 'modules', 'lastLogin', 'lastLogout'],
      }) as UserAPIData[];

      const keyQueryLimit = keyLimit * this.instance.keyPercentage;
      const intervalBetweenRequests = 60 / keyQueryLimit * 1000;

      for (const user of users) {
        if (user.modules.length > 0) {
          const urls = this.formURLs(user);
          if (this.areFatalIssues() === false) {
            (async () => {
              try {
                const [cleanHypixelPlayerData, cleanHypixelStatusData] = await this.fetch(user, urls);
                const hypixelData = Object.assign(cleanHypixelPlayerData, cleanHypixelStatusData);
                const now = Date.now();

                const oldUserAPIData = await SQLiteWrapper.getUser<RawUserAPIData, UserAPIData>({
                  discordID: user.discordID,
                  table: 'api',
                  columns: ['*'],
                  allowUndefined: false,
                }) as UserAPIData;

                const differences = compare(hypixelData, oldUserAPIData);

                const newUserAPIData = Object.assign(oldUserAPIData, differences, { lastUpdated: now });

                await this.updateDatabase({
                  differences: differences.primary,
                  now: now,
                  oldUserAPIData: oldUserAPIData,
                });

                const payLoad = {
                  client: this.client,
                  differences: differences,
                  userAPIData: newUserAPIData,
                };

                const modules = [];
                //I want it to yell at me if it is undefined rather than silent fail
                if (user.modules.includes('rewards')) modules.push(this.client.modules.get('rewards')!.execute(payLoad));
                if (user.modules.includes('friends')) modules.push(this.client.modules.get('friends')!.execute(payLoad));
                await Promise.all(modules);
              } catch (error) {
                await errorHandler({ error: error, moduleDataResolver: this });
              }
            })();
          }
          await setTimeout(intervalBetweenRequests * urls.length); //eslint-disable-line no-await-in-loop
        }
      }
    } catch (error) {
      await errorHandler({ error: error, moduleDataResolver: this });
    }
  }

  private formURLs(user: UserAPIData): string[] {
    const urls: string[] = [this.instance.baseURL.replace(/%{type}%/, 'player')];
    if (Number(user.lastLogin) > Number(user.lastLogout)) urls.push(this.instance.baseURL.replace(/%{type}%/, 'status'));

    return urls.map(url => url.replace(/%{uuid}%/, user.uuid));
  }

  private async fetch(user: UserAPIData, urls: string[]): Promise<[CleanHypixelPlayerData, CleanHypixelStatusData | undefined]> {
    const urlPromises: Promise<HypixelAPIOk>[] = urls.map(url => this.hypixelRequestCall.call(url), user);
    const hypixelAPIOk: HypixelAPIOk[] = await Promise.all(urlPromises);

    const hypixelPlayerData: CleanHypixelPlayerData = this.cleanPlayerData(hypixelAPIOk[0] as RawHypixelPlayer, user);
    const hypixelStatusData: CleanHypixelStatusData | undefined = this.cleanStatusData(hypixelAPIOk[1] as RawHypixelStatus | undefined);
    return [hypixelPlayerData, hypixelStatusData];
  }

  private async updateDatabase({
    differences,
    now,
    oldUserAPIData,
  }: {
    differences: Partial<CleanHypixelPlayerData>,
    now: number,
    oldUserAPIData: UserAPIData,
  }) {
    const userAPIDataUpdate: Partial<UserAPIData> = Object.assign({ lastUpdated: now }, differences);

    if (Object.keys(differences).length > 0) {
      const historyUpdate: History = Object.assign({ date: now }, differences);
      const history: History[] = oldUserAPIData.history;
      history.unshift(historyUpdate);
      history.splice(250);
      Object.assign(userAPIDataUpdate, { history: history });
    }

    await SQLiteWrapper.updateUser<Partial<UserAPIData>, RawUserAPIData>({
      discordID: oldUserAPIData.discordID,
      table: 'api',
      data: userAPIDataUpdate,
    });
  }

  areFatalIssues(): boolean { //Could be expanded
    const enabled = this.client.config.enabled === true;
    const unusualErrors = this.unusual.unusualErrorsLastMinute;
    const abortErrors = this.abort.abortsLastMinute;
    const timeoutExpired = Date.now() > this.instance.resumeAfter;
    return Boolean(enabled === false || unusualErrors > 1 || abortErrors > 1 || timeoutExpired === false);
  }

  private cleanPlayerData(rawHypixelPlayer: RawHypixelPlayer, userAPIData: UserAPIData) {
    const rawHypixelPlayerData: RawHypixelPlayerData = rawHypixelPlayer.player;
    return {
      firstLogin: rawHypixelPlayerData.firstLogin ?? null,
      lastLogin: rawHypixelPlayerData.lastLogin ?? null,
      lastLogout: rawHypixelPlayerData.lastLogout ?? null,
      version: rawHypixelPlayerData.mcVersionRp ?? userAPIData.version ?? null,
      language: rawHypixelPlayerData.userLanguage ?? userAPIData.language ?? 'ENGLISH',
      lastClaimedReward: rawHypixelPlayerData.lastClaimedReward ?? null,
      rewardScore: rawHypixelPlayerData.rewardScore ?? null,
      rewardHighScore: rawHypixelPlayerData.rewardHighScore ?? null,
      totalDailyRewards: rawHypixelPlayerData.totalDailyRewards ?? null,
      totalRewards: rawHypixelPlayerData.totalRewards ?? null,
    } as CleanHypixelPlayerData;
  }

  private cleanStatusData(rawHypixelStatus: RawHypixelStatus | undefined) {
    if (rawHypixelStatus === undefined) return undefined;
    const rawHypixelStatusData: RawHypixelStatusData = rawHypixelStatus.session;
    return {
      gameType: rawHypixelStatusData.gameType ?? null,
    } as CleanHypixelStatusData;
  }
}