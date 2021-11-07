import type { UserAPIData } from '../@types/database';
import type { HypixelAPI } from '../@types/hypixel';
import type { Response } from 'node-fetch';
import { hypixelAPIkey, hypixelAPIWebhook, keyLimit, ownerID } from '../../config.json';
import { formattedUnix, sendWebHook, timeout } from '../util/utility';
import { SQLiteWrapper } from '../database';
import { ErrorStackEmbed, HypixelAPIEmbed, isAbortError } from '../util/error/helper';
import { Abort, Instance, RateLimit, Unusual } from './HypixelRequestHelper';
import { RateLimitError } from '../util/error/RateLimitError';
import { HTTPError } from '../util/error/HTTPError';
import { Request } from './Request';

export class HypixelRequestCall {
  [key: string]: any;
  abort: Abort;
  rateLimit: RateLimit;
  unusual: Unusual;
  instance: Instance;

  constructor() {
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

      const minute = 60;
      const secondsToMS = 1000;
      const users = await new SQLiteWrapper().getAllUsers({ table: this.instance.userTable }) as UserAPIData[];
      const keyQueryLimit = keyLimit * this.instance.keyPercentage;
      const intervalBetweenRequests = minute / keyQueryLimit * secondsToMS;

      for (const user of users) {
        const urls = user.urls
          .split(' ')
          .map(url => this.instance.baseURL
          .replace(/%{type}%/, url)
          .replace(/%{uuid}%/, user.uuid));
        if (this.instance.enabled === true) this.call(urls, user);
        await timeout(intervalBetweenRequests * urls.length); //eslint-disable-line no-await-in-loop
      }
    } catch (error) {
      await this.handleRejects(error);
    }
  }

  async call(urls: string[], user: UserAPIData) {
    try {
      console.log(`${formattedUnix({ date: false, utc: true })}, ${this.instance.instanceUses}`);
      if (this.areFatalIssues() === true) return;

      this.instance.instanceUses += 1;
      const responses: Response[] | (HypixelAPI | null)[] = await Promise.all(urls.map(url =>
        new Request({
          maxAborts: 1,
          abortThreshold: this.instance.abortThreshold,
        }).request(url, {
          headers: { 'API-Key': hypixelAPIkey },
        }),
      )) as Response[];

      const JSONs = await Promise.all(responses.map(response =>
        tryParse(response),
      ));

      responses.forEach((response, index) => {
        if (response.ok) return;
        const errorData = {
          message: JSONs[index]?.cause,
          json: JSONs[index],
          response: response,
        };
        if (response.status === 429) throw new RateLimitError(errorData);
        else throw new HTTPError(errorData);
      });

      const { player: {
        firstLogin,
        lastLogin,
        lastLogout,
        version,
        language,
        mostRecentGameType,
        lastClaimedReward,
        rewardScore,
        rewardHighScore,
        totalDailyRewards,
      } } = JSONs[0]!;

      await new SQLiteWrapper().updateUser({
        discordID: user.discordID,
        table: 'api',
        data: {
          lastUpdated: Date.now(),
          firstLogin: firstLogin ?? null,
          lastLogin: lastLogin ?? null,
          lastLogout: lastLogout ?? null,
          version: version ?? user.version ?? null,
          language: language ?? user.language ?? null,
          mostRecentGameType: mostRecentGameType ?? null,
          lastClaimedReward: lastClaimedReward ?? null,
          rewardScore: rewardScore ?? null,
          rewardHighScore: rewardHighScore ?? null,
          totalDailyRewards: totalDailyRewards ?? null,
        },
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

  async handleRejects(error: unknown): Promise<void> {
    const incidentID = Math.random().toString(36).substring(2, 10).toUpperCase();
    console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | `, error);

    if (isAbortError(error)) this.abort.reportAbortError(this);
    else if (error instanceof RateLimitError) this.rateLimit.reportRateLimitError(this, error);
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
      embed: [hypixelAPIEmbed, errorStackEmbed],
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