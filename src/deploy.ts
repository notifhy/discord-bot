import type { SlashCommand } from './@types/index';
import { clientID, testGuild, discordAPIkey as token } from '../config.json';
import { Routes } from 'discord-api-types/v9';
import { REST } from '@discordjs/rest';
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

		await new REST({ version: '9' }).setToken(token).put(
			Routes.applicationGuildCommands(clientID, testGuild),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();