import type { UserAPIData } from '../@types/database';
import type { HypixelAPI } from '../@types/hypixel';
import { hypixelAPIkey, hypixelAPIWebhook, keyLimit, ownerID } from '../../config.json';
import { formattedUnix, sendWebHook, timeout } from '../util/utility';
import { SQLiteWrapper } from '../database';
import { ErrorStackEmbed, HypixelAPIEmbed, isAbortError } from '../util/error/helper';
import { Abort, Instance, RateLimit, Unusual } from './RequestHelper';
import fetch, { Response } from 'node-fetch';
import { RateLimitError } from '../util/error/RateLimitError';
import { HTTPError } from '../util/error/HTTPError';
import { Client } from 'discord.js';

export class RequestCreate {
  [key: string]: any; //Remove
  abort: Abort;
  rateLimit: RateLimit;
  unusual: Unusual;
  instance: Instance;

  constructor(client: Client) {
    this.abort = new Abort();
    this.rateLimit = new RateLimit();
    this.unusual = new Unusual();
    this.instance = new Instance();
    this.client = client;
  }

  async loopMaker() {
    try {
      if (this.areFatalIssues() === true) return;
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
    } catch (err) {
      const incidentID = Math.random().toString(36).substring(2, 10).toUpperCase();
      console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | `, err);

      this.unusual.reportUnusualError(this);

      const hypixelAPIEmbed = new HypixelAPIEmbed({
        requestCreate: this,
        error: err,
        incidentID: incidentID,
      });

      const errorStackEmbed = new ErrorStackEmbed({
        error: err,
        incidentID: incidentID,
      });

      await sendWebHook({
        content: `<@${ownerID[0]}>`,
        embed: [hypixelAPIEmbed, errorStackEmbed],
        webHook: hypixelAPIWebhook,
        suppressError: true,
      });
    }
  }

  async call(urls: string[], user: UserAPIData) {
    try {
      console.log(`${formattedUnix({ date: false, utc: true })}, ${this.instance.instanceUses}`);
      if (this.areFatalIssues() === true) return;

      this.instance.instanceUses += 1;
      const responses: Response[] | (HypixelAPI | null)[] = await Promise.all(urls.map(url =>
        this.request(url, {
          headers: { 'API-Key': hypixelAPIkey },
        }, {}),
      ));

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
    } catch (err) {
      const incidentID = Math.random().toString(36).substring(2, 10).toUpperCase();
      console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | `, err);

      if (isAbortError(err)) this.abort.reportAbortError(this);
      else if (err instanceof RateLimitError) this.rateLimit.reportRateLimitError(this, err);
      else this.unusual.reportUnusualError(this);

      const hypixelAPIEmbed = new HypixelAPIEmbed({
        requestCreate: this,
        error: err,
        incidentID: incidentID,
      });

      const errorStackEmbed = new ErrorStackEmbed({
        error: err,
        incidentID: incidentID,
      });

      await sendWebHook({
        content: this.isPriority(err) === true ? `<@${ownerID[0]}>` : undefined,
        embed: [hypixelAPIEmbed, errorStackEmbed],
        webHook: hypixelAPIWebhook,
        suppressError: true });
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

  async request(url: string, {
    ...fetchOptions
  }, {
    timesAborted = 0,
  }: {
    timesAborted?: number,
  }): Promise<Response> {
    const controller = new AbortController();
    const abortTimeout = setTimeout(() => controller.abort(), this.instance.abortThreshold).unref();

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        ...fetchOptions,
      });
      return response;
    } catch (err) {
      if (isAbortError(err) && timesAborted < 1) {
        return this.request(url, { ...fetchOptions }, { timesAborted: timesAborted + 1 });
      }
      throw err;
    } finally {
      clearTimeout(abortTimeout);
    }
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