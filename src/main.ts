import type { ClientEvents, SlashCommand } from './@types/index';
import { Client, Collection, Intents } from 'discord.js';
import { discordAPIkey as token } from '../config.json';
import * as fs from 'fs';

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

(async () => {
  const eventsFolder = fs.readdirSync('./events').filter(file => file.endsWith('.ts'));
  const commandsFolder = fs.readdirSync('./commands').filter(file => file.endsWith('.ts'));

  for (const file of eventsFolder) {
    // eslint-disable-next-line no-await-in-loop
    const { name, once, hasParameter, execute }: ClientEvents = await import(`./events/${file}`);
    const callExecute = (parameters: any) => hasParameter === true ? execute(parameters) : execute(client);
    if (once === false) client.on(name, parameters => callExecute(parameters));
    else client.once(name, parameters => callExecute(parameters));
  }

  for (const file of commandsFolder) {
    // eslint-disable-next-line no-await-in-loop
    const command: SlashCommand = await import(`./commands/${file}`);
    client.commands.set(command.name, command);
  }
})();

client.login(token);