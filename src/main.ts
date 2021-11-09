import type { ClientEvents, SlashCommand } from './@types/index';
import { Client, Collection, Intents } from 'discord.js';
import { discordAPIkey as token } from '../config.json';
import * as fs from 'fs/promises';
import { HypixelRequestCall } from './hypixelAPI/HypixelRequestCall';
import { api, blockedUsers, devMode } from '../dynamicConfig.json';
import { RegionLocales } from '../locales/localesHandler';
import { ModuleEvents } from './@types/modules';

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
client.hypixelAPI = new HypixelRequestCall();
client.hypixelAPI.instance.enabled = client.config.api;
client.regionLocales = new RegionLocales();

(async () => {
  const commandsFolder = (await fs.readdir('./commands')).filter(file => file.endsWith('.ts'));
  const eventsFolder = (await fs.readdir('./events')).filter(file => file.endsWith('.ts'));
  const modulesFolder = (await fs.readdir('./modules')).filter(file => file.endsWith('.ts'));

  const commandPromises: Promise<SlashCommand>[] = [];
  const eventPromises: Promise<ClientEvents>[] = [];
  const modulePromises: Promise<ModuleEvents>[] = [];

  for (const file of commandsFolder) commandPromises.push(import(`./commands/${file}`));
  for (const file of eventsFolder) eventPromises.push(import(`./events/${file}`));
  for (const file of modulesFolder) modulePromises.push(import(`./modules/${file}`));

  const resolvedPromises = await Promise.all([
    Promise.all(commandPromises),
    Promise.all(eventPromises),
    Promise.all(modulePromises),
  ]);

  for (const command of resolvedPromises[0]) {
    client.commands.set(command.properties.name, command);
  }

  for (const { properties: { name, once, hasParameter }, execute } of resolvedPromises[1]) {
    const callExecute = (parameters: any) => hasParameter === true ? execute(parameters) : execute(client);
    if (once === false) client.on(name, parameters => callExecute(parameters));
    else client.once(name, parameters => callExecute(parameters));
  }

  for (const { properties: { name }, execute } of resolvedPromises[2]) {
    console.log('sdad', name);
    client.hypixelAPI.on(name, execute);
  }

  await client.login(token);
})();