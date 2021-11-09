import type { UserAPIData } from '../@types/database';
import type { HypixelAPI, HypixelPlayerData } from '../@types/hypixel';
import type { Response } from 'node-fetch';
import { hypixelAPIkey, hypixelAPIWebhook, keyLimit, ownerID } from '../../config.json';
import { formattedUnix, sendWebHook, timeout } from '../util/utility';
import { SQLiteWrapper } from '../database';
import { ErrorStackEmbed, HypixelAPIEmbed, isAbortError } from '../util/error/helper';
import { Abort, Instance, RateLimit, Unusual } from './HypixelRequestHelper';
import { RateLimitError } from '../util/error/RateLimitError';
import { HTTPError } from '../util/error/HTTPError';
import { Request } from './Request';
import EventEmitter from 'node:events';

export class HypixelRequestCall extends EventEmitter {
  [key: string]: any;
  abort: Abort;
  rateLimit: RateLimit;
  unusual: Unusual;
  instance: Instance;

  constructor() {
    super();
    this.abort = new Abort();
    this.rateLimit = new RateLimit();
    this.unusual = new Unusual();
    this.instance = new Instance();
  }

  async callAll() {
    try {
      if (this.instance.resumeAfter > Date.now()) {
        await timeout(this.instance.resumeAfter - Date.now());
        return;
      }

      const users = await SQLiteWrapper.getAllUsers({
        table: this.instance.userTable,
        columns: ['discordID', 'uuid', 'modules'],
      }) as UserAPIData[];

      const keyQueryLimit = keyLimit * this.instance.keyPercentage;
      const intervalBetweenRequests = 60 / keyQueryLimit * 1000;

      for (const user of users) {
        if (user.modules) {
          const url = this.instance.baseURL.replace(/%{uuid}%/, user.uuid);
          if (this.instance.enabled === true) this.call(url, user);
          await timeout(intervalBetweenRequests); //eslint-disable-line no-await-in-loop
        }
      }
    } catch (error) {
      await this.handleRejects(error);
    }
  }

  async call(url: string, user: UserAPIData) {
    try {
      console.log(`${formattedUnix({ date: true, utc: true })}, ${this.instance.instanceUses}`);
      if (this.areFatalIssues() === true) return;

      this.instance.instanceUses += 1;
      const response: Response | HypixelAPI | null = await new Request({
        maxAborts: 1,
        abortThreshold: this.instance.abortThreshold,
      }).request(url, {
        headers: { 'API-Key': hypixelAPIkey },
      }) as Response;

      const JSON = await tryParse(response);

      if (response.ok === false) {
        const errorData = {
          message: JSON?.cause,
          json: JSON,
          response: response,
        };
        if (response.status === 429) throw new RateLimitError(errorData);
        else throw new HTTPError(errorData);
      }

      //Data is all good!

      const now = Date.now();
      const modules = user.modules?.split(' ');
      const apiData = JSON!.player;
      const playerData = {
        lastUpdated: Date.now(),
        firstLogin: apiData.firstLogin ?? null,
        lastLogin: apiData.lastLogin ?? null,
        lastLogout: apiData.lastLogout ?? null,
        version: apiData.version ?? null,
        language: apiData.language ?? null,
        mostRecentGameType: apiData.mostRecentGameType ?? null,
        lastClaimedReward: apiData.lastClaimedReward ?? null,
        rewardScore: apiData.rewardScore ?? null,
        rewardHighScore: apiData.rewardHighScore ?? null,
        totalRewards: apiData.totalRewards ?? null,
        totalDailyRewards: apiData.totalDailyRewards ?? null,
      };

      if (modules?.includes('defender')) {
        this.emit('defenderEvent', user.discordID, now, playerData as HypixelPlayerData);
      }

      if (modules?.includes('friends')) {
        this.emit('friendsEvent', user.discordID, now, playerData as HypixelPlayerData);
      }

      if (modules?.includes('daily')) {
        this.emit('dailyEvent', user.discordID, now, playerData as HypixelPlayerData);
      }

      await SQLiteWrapper.updateUser({
        discordID: user.discordID,
        table: 'api',
        data: playerData,
      });
    } catch (error) {
      await this.handleRejects(error);
    }

    async function tryParse(response: Response): Promise<HypixelAPI | null> {
      try {
        const json = await response.json();
        return json;
      } catch {
        return null;
      }
    }
  }

  private async handleRejects(error: unknown): Promise<void> {
    const incidentID = Math.random().toString(36).substring(2, 10).toUpperCase();
    console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | `, error);

    if (isAbortError(error)) this.abort.reportAbortError(this);
    else if (error instanceof RateLimitError) this.rateLimit.reportRateLimitError(this, error?.json?.global);
    else this.unusual.reportUnusualError(this);

    const hypixelAPIEmbed = new HypixelAPIEmbed({
      requestCreate: this,
      error: error,
      incidentID: incidentID,
    });

    const errorStackEmbed = new ErrorStackEmbed({
      error: error,
      incidentID: incidentID,
    });

    await sendWebHook({
      content: this.isPriority(error) === true ? `<@${ownerID.join('><@')}>` : undefined,
      embeds: [hypixelAPIEmbed, errorStackEmbed],
      webhook: hypixelAPIWebhook,
      suppressError: false,
    });
  }

  areFatalIssues(): boolean { //Could be expanded
    const unusualErrors = this.unusual.unusualErrorsLastMinute;
    const abortErrors = this.abort.abortsLastMinute;
    const timeoutExpired = Date.now() > this.instance.resumeAfter;
    return Boolean(unusualErrors > 1 || abortErrors > 1 || timeoutExpired === false);
  }

  isPriority(error: unknown) {
    const case1 = error instanceof Error && !isAbortError(error);
    const case2 = isAbortError(error) && this.abort.abortsLastMinute > 2;
    const case3 = isAbortError(error) && this.abort.timeoutLength > this.abort.baseTimeout;
    return Boolean(case1 === true || case2 === true || case3 === true);
  }
}