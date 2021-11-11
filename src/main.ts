import type { ClientEvents, SlashCommand } from './@types/client';
import { Client, Collection, Intents } from 'discord.js';
import { discordAPIkey as token } from '../config.json';
import * as fs from 'fs/promises';
import { RegionLocales } from '../locales/localesHandler';
import { SQLiteWrapper } from './database';
import { DatabaseConfig } from './@types/database';
import { ModuleDataResolver } from './hypixelAPI/ModuleDataResolver';

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
client.customStatus = false;
client.hypixelAPI = new ModuleDataResolver(client);
client.regionLocales = new RegionLocales();

(async () => {
  const commandsFolder = (await fs.readdir('./commands')).filter(file => file.endsWith('.ts'));
  const eventsFolder = (await fs.readdir('./events')).filter(file => file.endsWith('.ts'));

  const commandPromises: Promise<SlashCommand>[] = [];
  const eventPromises: Promise<ClientEvents>[] = [];

  for (const file of commandsFolder) commandPromises.push(import(`./commands/${file}`));
  for (const file of eventsFolder) eventPromises.push(import(`./events/${file}`));

  const resolvedPromises = await Promise.all([
    Promise.all(commandPromises),
    Promise.all(eventPromises),
  ]);

  for (const command of resolvedPromises[0]) {
    client.commands.set(command.properties.name, command);
  }

  for (const { properties: { name, once, hasParameter }, execute } of resolvedPromises[1]) {
    const callExecute = (parameters: any) => hasParameter === true ? execute(parameters) : execute(client);
    if (once === false) client.on(name, parameters => callExecute(parameters));
    else client.once(name, parameters => callExecute(parameters));
  }

  const config = await SQLiteWrapper.queryGet({
    query: 'SELECT * FROM config WHERE rowid = 1',
  }) as DatabaseConfig;

  client.config = {
    baseURL: config.baseURL,
    blockedUsers: JSON.parse(config.blockedUsers),
    devMode: Boolean(config.devMode),
    enabled: Boolean(config.enabled),
    uses: config.uses,
  };

  await client.login(token);
})();