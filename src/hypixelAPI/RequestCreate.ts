import { hypixelAPIkey, hypixelAPIWebhook } from '../../config.json';
import { commandEmbed, sendWebHook, timeout } from '../util/utility';
import { AbortError, FetchError } from 'node-fetch';
import { RequestHandler } from './RequestHandler';
import { queryGetAll, queryRun } from '../database';

class RequestCreate {
  requestHandler: RequestHandler;
  keyLimit: number;

  constructor() {
    this.requestHandler = new RequestHandler();
    this.keyLimit = 120;
  }

  async loopCreator(url: string) {
    try {
      const userTable = 'users';
      const users = await queryGetAll(`SELECT * FROM ${userTable}`);
      const keyOverhead = 90 / 100;
      const keyOverheadValue = this.keyLimit * keyOverhead;
      const intervalBetweenRequests = keyOverheadValue / users.length * 1000;

      for (const user of users) {
        this.request(url).then(async (data) => {
          await queryRun('');
        });
        // eslint-disable-next-line no-await-in-loop
        await timeout(intervalBetweenRequests);
      }
    } catch (err) {

    }
  }

  async request(url: string) {
    try {
      const response = await this.requestHandler.request(url, {
        headers: {
          'API-Key': hypixelAPIkey,
        },
      });

      return this.requestHandler.cleanRequest(response as Response | AbortError | FetchError);
    } catch (err) {
      const unexpectedError = commandEmbed({ color: '#AA0000', footer: 'Unexpected Error' })
        .setTitle('Error')
        .setDescription(err instanceof Error ? err.stack?.slice(0, 4096) ?? err.message.slice(0, 4096) ?? '\u200B' : JSON.stringify(err));
      await sendWebHook({ embed: unexpectedError, webHook: hypixelAPIWebhook, suppressError: true });
      return null;
    }
  }
}