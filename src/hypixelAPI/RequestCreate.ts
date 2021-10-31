import type { User } from '../@types/database';
import type { HypixelAPI } from '../@types/hypixel';
import { hypixelAPIkey, hypixelAPIWebhook, keyLimit, ownerID } from '../../config.json';
import { cleanLength, formattedUnix, sendWebHook, timeout } from '../util/utility';
import { queryGetAll, queryRun } from '../database';
import { HypixelAPIEmbed, isAbortError } from '../util/error/helper';
import { AbortError, Instance, RateLimit } from './RequestHelper';
import fetch, { Response } from 'node-fetch';
import { RateLimitError } from '../util/error/RateLimitError';
import { HTTPError } from '../util/error/HTTPError';
import { Client } from 'discord.js';

export class RequestCreate {
  [key: string]: any
  instance: Instance;
  abortError: AbortError;
  rateLimit: RateLimit;

  constructor(client: Client) {
    this.instance = new Instance;
    this.abortError = new AbortError();
    this.rateLimit = new RateLimit;
    this.client = client;
  }

  async loopMaker() {
    const userTable = 'users';
    const baseURL = 'https://api.hypixel.net/%{type}%?uuid=%{uuid}%';
    const minute = 60;
    const secondsToMS = 1000;
    const users = await queryGetAll(`SELECT * FROM ${userTable}`) as User[];
    const keyQueryLimit = keyLimit * this.instance.keyPercentage;
    const intervalBetweenRequests = minute / keyQueryLimit * secondsToMS;

    for (const user of users) {
      const urls = user.urls.split(' ').map(url => baseURL.replace(/%{type}%/, url).replace(/%{uuid}%/, user.uuid));
      if (this.instance.enabled === true) this.call(urls, user);
      // eslint-disable-next-line no-await-in-loop
      await timeout(intervalBetweenRequests * (urls.length || 1)); //Not ideal, refactor suggested
    }
  }

  async call(urls: string[], user: User) {
    try {
      console.log(`${formattedUnix({ date: false, utc: true })}, ${this.instance.instanceUses}`);
      if (this.areFatalIssues() === true) return;

      this.instance.instanceUses += 1;
      const controller = new AbortController();
      const abortTimeout = setTimeout(() => controller.abort(), 2500).unref();
      const responses: Response[] | (HypixelAPI | null)[] = await Promise.all(urls.map(url =>
        this.request(url, {}),
      ));

      clearTimeout(abortTimeout);

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

      const { player: { firstLogin, lastLogin, lastLogout, version, language } } = JSONs[0]!;

      await queryRun(`UPDATE users SET lastUpdated = '${Date.now()}', firstLogin = '${firstLogin ?? null}', lastLogin = '${lastLogin ?? null}', lastLogout = '${lastLogout ?? null}', version = '${version ?? user.version}', language = '${language ?? user.language}' WHERE discordID = '${user.discordID}'`);
    } catch (err) {
      const incidentID = Math.random().toString(36).substring(2, 10).toUpperCase();
      console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | ${JSON.stringify(err)}`);

      if (isAbortError(err)) this.abortError.reportAbortError(this);
      else if (err instanceof RateLimitError) this.rateLimit.reportRateLimitError(this, err);
      else this.instance.reportUnusualError();

      const incidentEmbed = new HypixelAPIEmbed({
        RequestInstance: this,
        error: err,
        incidentID:
        incidentID,
        automatic: true,
      });

      await sendWebHook({
        content: this.isPriority(err) === true ? `<@${ownerID[0]}>` : undefined,
        embed: incidentEmbed,
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
    timesAborted = 0,
    ...fetchOptions
  }: {
    timesAborted?: number,
  }): Promise<Response> {
    const controller = new AbortController();
    const abortTimeout = setTimeout(() => controller.abort(), this.instance.abortThreshold).unref();

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'API-Key': hypixelAPIkey },
        ...fetchOptions,
      });
      return response;
    } catch (err) {
      if (isAbortError(err)) console.log('abort!');
      if (isAbortError(err) && timesAborted < 1) {
        return this.request(url, { timesAborted: timesAborted + 1, ...fetchOptions });
      }
      throw err;
    } finally {
      clearTimeout(abortTimeout);
    }
  }

  areFatalIssues(): boolean {
    const unusualErrors = this.instance.unusualErrorsLastMinute;
    const abortErrors = this.abortError.abortsLastMinute;
    const timeoutExpired = Date.now() > this.instance.resumeAfter;
    return unusualErrors > 1 || abortErrors > 1 || timeoutExpired === false;
  }

  isPriority(error: unknown) {
    const case1 = error instanceof Error && !isAbortError(error);
    const case2 = isAbortError(error) && this.abortError.abortsLastMinute > 1;
    return Boolean(case1 === true || case2 === true);
  }
}