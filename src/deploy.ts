import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import type { ClientCommand } from './@types/client';
import { Log } from './utility/Log';

(async () => {
    try {
        Log.log('Starting deployment of the deploy command.');

        const deployCommand = (
            (await import(`${__dirname}/commands/deploy.ts`)) as ClientCommand
        ).properties.structure;

        await new REST({ version: '10' })
            .setToken(process.env.DISCORD_TOKEN!)
            .put(Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID!), {
                body: [deployCommand],
            });

        Log.log('Successfully deployed the deploy command.');
    } catch (error) {
        Log.error(error);
    }
})();