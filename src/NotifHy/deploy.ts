import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import type { ClientCommand } from './@types/client';
import {
    clientID,
    discordAPIkey,
} from '../../config.json';
import { Log } from './utility/Log';

(async () => {
    try {
        Log.log('Starting deployment of the deploy command.');

        const deployCommand = (
            (await import(`${__dirname}/commands/deploy.ts`)) as ClientCommand
        ).properties.structure;

        await new REST({ version: '9' })
            .setToken(discordAPIkey)
            .put(Routes.applicationCommands(clientID), {
                body: [deployCommand],
            });

        Log.log('Successfully deployed the deploy command.');
    } catch (error) {
        Log.error(error);
    }
})();