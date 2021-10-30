import type { User } from '../@types/database';
import type { HypixelAPI } from '../@types/hypixel';
import { hypixelAPIWebhook, keyLimit, ownerID } from '../../config.json';
import { formattedUnix, sendWebHook, timeout } from '../util/utility';
import { RequestHandler } from './RequestHandler';
import { queryGetAll, queryRun } from '../database';
import { HypixelAPIError, isAbortError } from '../util/error/helper';
import { AbortError, Instance, RateLimit } from './RequestHelper';

export class RequestCreate {
  instance: Instance;
  abortError: AbortError;
  rateLimit: RateLimit;
  requestHandler: RequestHandler;

  constructor() {
    this.instance = new Instance;
    this.abortError = new AbortError();
    this.rateLimit = new RateLimit;
    this.requestHandler = new RequestHandler(this.instance, this.abortError, this.rateLimit);
  }

  async loopMaker(urls: string[]) {
    const userTable = 'users';
    const minute = 60;
    const secondsToMS = 1000;
    const users = await queryGetAll(`SELECT * FROM ${userTable}`) as User[];
    const keyQueryLimit = keyLimit * this.instance.keyPercentage;
    const intervalBetweenRequests = minute / keyQueryLimit * secondsToMS;

    for (const user of users) {
      this.call(urls, user);
      // eslint-disable-next-line no-await-in-loop
      await timeout(intervalBetweenRequests);
    }
  }

  async call(urls: string[], user: User) {
    try {
      const errors = this.instance.errorsLastMinute < 2;
      const abortErrors = this.instance.errorsLastMinute < 2;
      const rateLimitExpired = Date.now() > (this.instance.resumeAfter ?? 0);

      this.instance.instanceUses += 1;

      if (rateLimitExpired === false || errors === false || abortErrors === false) return;

      const promises: HypixelAPI[] = await Promise.all(urls.map(url =>
        this.requestHandler.request(url, user.uuid).then(promise => this.requestHandler.cleanRequest(promise)),
      ));

      const { player: { firstLogin, lastLogin, lastLogout, version, language } } = promises[0];

      await queryRun(`UPDATE users SET lastUpdated = '${Date.now()}', firstLogin = '${firstLogin ?? null}', lastLogin = '${lastLogin ?? null}', lastLogout = '${lastLogout ?? null}', version = '${version ?? user.version}', language = '${language ?? user.language}' WHERE discordID = '${user.discordID}'`);
    } catch (err) {
      const incidentID = Math.random().toString(36).substring(2, 10).toUpperCase();
      const isPriority = (err instanceof Error && !isAbortError(err)) || (isAbortError(err) && this.abortError.abortsLastMinute > 1);
      console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | ${err instanceof Error ? err.stack ?? err.message : JSON.stringify(err)}`);
      const incidentEmbed = new HypixelAPIError({ RequestInstance: this, error: err, incidentID: incidentID, automatic: true })
        .addField('Last Minute Statistics', `Aborts: ${this.abortError.abortsLastMinute}\nRate Limits Hit: ${this.rateLimit.rateLimitErrorsLastMinute}\nErrors: ${this.instance.errorsLastMinute}`)
        .addField('API Key', `Dedicated Queries: ${this.instance.keyPercentage * keyLimit} or ${this.instance.keyPercentage * 100}%\nInstance Queries: ${this.instance.instanceUses}`);

      await sendWebHook({ content: isPriority === true ? `<@${ownerID[0]}>` : undefined, embed: incidentEmbed, webHook: hypixelAPIWebhook, suppressError: true });
    }
  }
}