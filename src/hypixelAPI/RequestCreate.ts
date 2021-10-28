import type { User } from '../@types/database';
import type { HypixelAPI } from '../@types/hypixel';
import { hypixelAPIWebhook, keyLimit, ownerID } from '../../config.json';
import { cleanLength, formattedUnix, sendWebHook, timeout } from '../util/utility';
import { AbortError } from 'node-fetch';
import { RequestHandler } from './RequestHandler';
import { queryGetAll, queryRun } from '../database';
import { RateLimitError } from './RateLimitError';
import { hypixelAPIerrorEmbedFactory } from '../util/error/helper';

export class RequestCreate {
  requestHandler: RequestHandler;

  constructor() {
    this.requestHandler = new RequestHandler();
  }

  async loopMaker(urls: string[]) {
    const userTable = 'users';
    const users = await queryGetAll(`SELECT * FROM ${userTable}`) as User[];
    const keyOverhead = this.requestHandler.instance.keyPercentage / 100;
    const keyOverheadValue = keyLimit * keyOverhead;
    const intervalBetweenRequests = keyOverheadValue / users.length * 1000;

    for (const user of users) {
      this.call(urls, user);
      // eslint-disable-next-line no-await-in-loop
      await timeout(intervalBetweenRequests);
    }
  }

  async call(urls: string[], user: User) {
    try {
      const errors = this.requestHandler.instance.errorsLastMinute < 2;
      const abortErrors = this.requestHandler.instance.errorsLastMinute < 2;
      const rateLimit = this.requestHandler.rateLimit.rateLimit === false;
      const rateLimitExpired = Date.now() > (this.requestHandler.instance.resumeAfter ?? 0);

      this.requestHandler.instance.sessionUses += 1;

      if (rateLimit === false || rateLimitExpired === false || errors === false || abortErrors === false) return;

      const promises: HypixelAPI[] = await Promise.all(urls.map(url =>
        this.requestHandler.request(url, user.uuid),
      ));

      const { player: { firstLogin, lastLogin, lastLogout, version, language } } = promises[0];

      await queryRun(`UPDATE table SET firstLogin = ${firstLogin}, lastLogin = ${lastLogin}, lastLogout = ${lastLogout}, version = ${version ?? user.version}, language = ${language ?? user.language} WHERE id = ${user.discordID}`);
    } catch (err) {
      const incidentID = Math.random().toString(36).substring(2, 10);
      const incidentEmbed = hypixelAPIerrorEmbedFactory({ incidentID: incidentID, automatic: true });
      const instance = this.requestHandler.instance;
      const isPriority = err instanceof RateLimitError || err instanceof Error;
      console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | ${err instanceof Error ? err.stack ?? err.message : JSON.stringify(err)}`);
      if (err instanceof AbortError) {
        incidentEmbed
          .setTitle('AbortError')
          .addField('Resuming In', cleanLength(instance.resumeAfter! - Date.now()) ?? 'Not applicable');
      } else if (err instanceof RateLimitError) {
        incidentEmbed
          .setTitle('RateLimitError')
          .addField('Resuming In', cleanLength(instance.resumeAfter! - Date.now()) ?? 'Not applicable')
          .addField('Global', this.requestHandler.rateLimit.isGlobal.toString());
      } else if (err instanceof Error) {
        incidentEmbed
          .setTitle(err.name.replace(/([A-Z]+)/g, ' $1').replace(/([A-Z][a-z])/g, ' $1')) //Taken from https://stackoverflow.com/a/7225474
          .addField('Resuming In', cleanLength(instance.resumeAfter! - Date.now()) ?? 'Not applicable')
          .addField('Cause', this.requestHandler.rateLimit.cause ?? 'Unknown')
          .addField('Global', this.requestHandler.rateLimit.isGlobal.toString());
      } else {
        incidentEmbed
          .setTitle('Unknown Incident')
          .setDescription(JSON.stringify(err));
      }

      incidentEmbed
        .addField('Last Minute Statistics', `Aborts: ${instance.abortsLastMinute}\nErrors: ${instance.errorsLastMinute}`)
        .addField('API Key', `Percentage of API key used: ${instance.keyPercentage}`);

      await sendWebHook({ content: isPriority === true ? `<@${ownerID[0]}>` : undefined, embed: incidentEmbed, webHook: hypixelAPIWebhook, suppressError: true });
    }
  }
}