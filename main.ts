import { Client, Intents } from 'discord.js';
import { discordAPIkey as token } from './config.json';

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setStatus('dnd');
});

client.login(token);