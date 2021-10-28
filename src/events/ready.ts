import type { EventProperties } from '../@types/index';
import type { Client } from 'discord.js';
import { RequestCreate } from '../hypixelAPI/RequestCreate';
import { formattedUnix } from '../util/utility';

export const properties: EventProperties = {
  name: 'ready',
  once: true,
  hasParameter: false,
};

export const execute = async (client: Client) => {
  console.log(`Logged in as ${client!.user!.tag}!`);

  const requestInstance = new RequestCreate();
  const urls: string[] = ['https://api.hypixel.net/player?uuid=%{}%'];

  await recursive();

  let times = 0;

  async function recursive() {
    console.log(formattedUnix({ date: false, utc: true }));
    if (times < 10) await requestInstance.loopMaker(urls);
    times++;
    recursive();
  }
};