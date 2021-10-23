import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { discordAPIkey as token } from '../config.json';
import fs from 'fs';

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.ts'));
const clientId = '900196476951601153';

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
    for (const file of commandFiles) {
      // eslint-disable-next-line no-await-in-loop
      const command = await import(`./commands/${file}`);
      commands.push(command.structure);
    }

		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();