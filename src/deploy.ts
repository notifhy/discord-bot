import type { SlashCommand } from './@types/client';
import { clientID, discordAPIkey } from '../config.json';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import fs from 'fs';

const commands: any = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.ts'));

(async () => {
	try {
    for (const file of commandFiles) {
      // eslint-disable-next-line no-await-in-loop
      const { properties: { structure } }: SlashCommand = await import(`./commands/${file}`);
      commands.push(structure);
    }

		console.log('Started refreshing application (/) commands.');

		await new REST({ version: '9' }).setToken(discordAPIkey).put(
			Routes.applicationGuildCommands(clientID, '873000534955667496'),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();