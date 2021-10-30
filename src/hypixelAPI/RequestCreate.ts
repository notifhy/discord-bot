import type { User } from '../@types/database';
import type { HypixelAPI } from '../@types/hypixel';
import { hypixelAPIkey, hypixelAPIWebhook, keyLimit, ownerID } from '../../config.json';
import { formattedUnix, sendWebHook, timeout } from '../util/utility';
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
      const urls = user.urls.split(' ').map(url => baseURL.replace(/%{type}%/, url));
      if (this.instance.enabled === true) this.call(urls, user);
      // eslint-disable-next-line no-await-in-loop
      await timeout(intervalBetweenRequests * (urls.length || 1));
    }
  }

  async call(urls: string[], user: User) {
    try {
      console.log(`${formattedUnix({ date: false, utc: true })}, ${this.instance.instanceUses}`);
      const unusualErrors = this.instance.unusualErrorsLastMinute < 2;
      const abortErrors = this.abortError.abortsLastMinute < 2;
      const timeoutExpired = Date.now() > (this.instance.resumeAfter ?? 0);
      if (timeoutExpired === false || unusualErrors === false || abortErrors === false) return;

      this.instance.instanceUses += 1;

      const promises: HypixelAPI[] = await Promise.all(urls.map(url =>
        this.request(url, user.uuid),
      ));

      const { player: { firstLogin, lastLogin, lastLogout, version, language } } = promises[0];

      await queryRun(`UPDATE users SET lastUpdated = '${Date.now()}', firstLogin = '${firstLogin ?? null}', lastLogin = '${lastLogin ?? null}', lastLogout = '${lastLogout ?? null}', version = '${version ?? user.version}', language = '${language ?? user.language}' WHERE discordID = '${user.discordID}'`);
    } catch (err) {
      const incidentID = Math.random().toString(36).substring(2, 10).toUpperCase();
      const isPriority = (err instanceof Error && !isAbortError(err)) ||
        (isAbortError(err) && this.abortError.abortsLastMinute > 1);

      const {
        unusualErrorsLastMinute,
        instanceUses,
        keyPercentage,
      } = this.instance.getInstance();

      const incidentEmbed = new HypixelAPIEmbed({
        RequestInstance: this,
        error: err,
        incidentID:
        incidentID,
        automatic: true,
      })
        .addField('Last Minute Statistics', `Abort Errors: ${this.abortError.abortsLastMinute}\nRate Limit Errors: ${this.rateLimit.rateLimitErrorsLastMinute}\nOther Errors: ${unusualErrorsLastMinute}`)
        .addField('API Key', `Dedicated Queries: ${keyPercentage * keyLimit} or ${keyPercentage * 100}%\nInstance Queries: ${instanceUses}`);

      console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | ${JSON.stringify(err)}`);
      await sendWebHook({
        content: isPriority === true ? `<@${ownerID[0]}>` : undefined,
        embed: incidentEmbed,
        webHook: hypixelAPIWebhook,
        suppressError: true });
    }
  }

  async request(url: string, uuid: string, options?: object): Promise<HypixelAPI> {
    const controller = new AbortController();
    const abortTimeout = setTimeout(() => controller.abort(), 2500).unref();

    try {
      const response = await fetch(url.replace(/%{uuid}%/, uuid), {
        signal: controller.signal,
        headers: { 'API-Key': hypixelAPIkey },
        ...options,
      });
      const json = await tryFetch(response) as HypixelAPI | null;
      if (response.ok === true && json !== null) return json;

      if (response.status === 429) {
        throw new RateLimitError({
          message: json?.cause ?? 'Hit a rate limit',
          status: response.status ?? 'Unknown',
          json: json,
          path: url,
          uuid: uuid,
        });
      }

      throw new HTTPError({
        message: json?.cause ?? undefined,
        status: response.status ?? 'Unknown',
        path: url,
        uuid: uuid,
      });
    } catch (err) {
      const higherTimeout = Math.max(this.instance.resumeAfter, Date.now());
      if (isAbortError(err)) {
        this.abortError.addAbort();
        const timeoutLength = higherTimeout + this.abortError.generateTimeoutLength();
        if (this.abortError.abortsLastMinute > 1) this.instance.resumeAfter = timeoutLength;
      } else if (err instanceof RateLimitError) {
        this.rateLimit.setRateLimit({ isGlobal: err.json?.global ?? false });
        this.instance.keyPercentage -= 0.05;
        this.instance.resumeAfter = higherTimeout + this.rateLimit.generateTimeoutLength();
      } else {
        this.instance.addUnusualError();
        const timeoutLength = higherTimeout + this.instance.generateTimeoutLength();
        if (this.instance.unusualErrorsLastMinute > 1) this.instance.resumeAfter = timeoutLength;
      }

      throw err;
    } finally {
      clearTimeout(abortTimeout);
    }

    async function tryFetch(response: Response): Promise<HypixelAPI | null> {
      try {
        const json = await response.json();
        return json;
      } catch {
        return null;
      }
    }
  }
}