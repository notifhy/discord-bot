import type { ClientEvents, SlashCommand } from './@types/index';
import { Client, Collection, Intents } from 'discord.js';
import { discordAPIkey as token } from '../config.json';
import * as fs from 'fs/promises';
import { RequestCreate } from './hypixelAPI/RequestCreate';
import { api, blockedUsers, devMode } from '../dynamicConfig.json';

process.on('unhandledRejection', error => {
  console.log('unhandled', error);
});

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
  allowedMentions: {
    parse: ['users', 'roles'],
    repliedUser: true,
  },
  presence: {
    status: 'dnd',
    activities: [{ type: 'WATCHING', name: 'HELLO' }],
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
client.hypixelAPI.requests = new RequestCreate(client);
client.hypixelAPI.data = new Collection;

(async () => {
  const eventsFolder = (await fs.readdir('./events')).filter(file => file.endsWith('.ts'));
  const commandsFolder = (await fs.readdir('./commands')).filter(file => file.endsWith('.ts'));

  for (const file of eventsFolder) {
    // eslint-disable-next-line no-await-in-loop
    const { properties: { name, once, hasParameter }, execute }: ClientEvents = await import(`./events/${file}`);
    const callExecute = (parameters: any) => hasParameter === true ? execute(parameters) : execute(client);
    if (once === false) client.on(name, parameters => callExecute(parameters));
    else client.once(name, parameters => callExecute(parameters));
  }

  for (const file of commandsFolder) {
    // eslint-disable-next-line no-await-in-loop
    const command: SlashCommand = await import(`./commands/${file}`);
    client.commands.set(command.properties.name, command);
  }

  client.hypixelAPI.requests.instance.enabled = client.config.api;

  if (client.config.api === true) await client.hypixelAPI.requests.loopMaker();

  await client.login(token);
})();