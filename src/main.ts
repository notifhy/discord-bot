import type { ClientEvents, SlashCommand } from './@types/index';
import type { Locales } from './@types/locales';
import { Client, Collection, Intents } from 'discord.js';
import { discordAPIkey as token } from '../config.json';
import * as fs from 'fs/promises';
import { HypixelRequestCall } from './hypixelAPI/HypixelRequestCall';
import { api, blockedUsers, devMode } from '../dynamicConfig.json';
import { RegionLocales } from '../locales/localesHandler';

process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error);
});

process.on('uncaughtException', error => {
  console.log('uncaughtException', error);
});

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
  allowedMentions: {
    parse: ['users', 'roles'],
    repliedUser: true,
  },
  presence: {
    status: 'dnd',
    activities: [{ type: 'WATCHING', name: 'initialization | /help /register' }],
  },
  ws: { properties: { $browser: 'Discord iOS' } },
});

client.commands = new Collection();
client.cooldowns = new Collection();
client.config = {
  api: api,
  blockedUsers: blockedUsers,
  devMode: devMode,
};
client.customStatus = false;
client.hypixelAPI = {
  requests: new HypixelRequestCall(),
  data: new Collection,
};
client.hypixelAPI.requests.instance.enabled = client.config.api;

(async () => {
  const eventsFolder = (await fs.readdir('./events')).filter(file => file.endsWith('.ts'));
  const commandsFolder = (await fs.readdir('./commands')).filter(file => file.endsWith('.ts'));

  const eventsPromises: Promise<ClientEvents>[] = [];
  const commandsPromises: Promise<SlashCommand>[] = [];

  for (const file of eventsFolder) {
    eventsPromises.push(import(`./events/${file}`));
  }

  for (const file of commandsFolder) {
    commandsPromises.push(import(`./commands/${file}`));
  }

  const resolvedPromises = await Promise.all([
    Promise.all(eventsPromises),
    Promise.all(commandsPromises),
  ]);

  for (const { properties: { name, once, hasParameter }, execute } of resolvedPromises[0]) {
    const callExecute = (parameters: any) => hasParameter === true ? execute(parameters) : execute(client);
    if (once === false) client.on(name, parameters => callExecute(parameters));
    else client.once(name, parameters => callExecute(parameters));
  }

  for (const command of resolvedPromises[1]) {
    client.commands.set(command.properties.name, command);
  }

  client.regionLocales = new RegionLocales();

  if (client.config.api === true) await client.hypixelAPI.requests.callAll();

  await client.login(token);
})();