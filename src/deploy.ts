import type { ClientCommand } from './@types/client';
import {
    clientID,
    discordAPIkey,
} from '../config.json';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

(async () => {
    try {
        console.log('Starting deployment of the deploy command.');

        const deployCommand = (
            (await import(`${__dirname}/commands/deploy.ts`)) as ClientCommand
        ).properties.structure;

        await new REST({ version: '9' })
            .setToken(discordAPIkey)
            .put(Routes.applicationCommands(clientID), {
                body: [deployCommand],
            });

        console.log('Successfully deployed the deploy command.');
    } catch (error) {
        console.error(error);
    }
})();
