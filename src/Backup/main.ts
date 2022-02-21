import {
    auth,
    drive as googleDrive,
} from '@googleapis/drive';
import { Constants } from './util/Constants';
import { ErrorHandler } from '../utility/errors/ErrorHandler';
import { GaxiosError } from 'gaxios';
import { googleCredentials } from '../../config.json';
import { Log } from '../utility/Log';
import { setTimeout } from 'node:timers/promises';
import { Timeout } from '../utility/Timeout';
import fsSync from 'node:fs';
import process from 'node:process';

/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */

process.on('exit', exitCode => {
    Log.log(`Exiting with code ${exitCode}`);
});

process.on('unhandledRejection', async error => {
    Log.error('unhandledRejection');
    await ErrorHandler.init(error);
    process.exit(1);
});

process.on('uncaughtException', async error => {
    Log.error('uncaughtException');
    await ErrorHandler.init(error);
    process.exit(1);
});

const {
    addError,
    isTimeout,
    getPauseFor,
    getTimeout,
} = new Timeout({ baseTimeout: 300_000 });

(async () => {
    const authorization = await auth.getClient({
        scopes: Constants.scopes,
        credentials: googleCredentials,
    });

    const drive = googleDrive({
        version: 'v3',
        auth: authorization,
    });

    while (true) {
        try {
            if (isTimeout()) {
                await setTimeout(getTimeout().pauseFor);
            }

            const time = new Date().toLocaleString(
                undefined,
                { hour12: false },
            );

            await drive.files.create({
                requestBody: {
                    name: `${time}.db`,
                    parents: [Constants.parentFolder],
                },
                media: {
                    mimeType: 'application/octet-stream',
                    body: fsSync.createReadStream(`${__dirname}/../../database.db`),
                },
            });

            Log.log('Uploaded backup');

            await setTimeout(Constants.interval);
        } catch (error) {
            if (error instanceof GaxiosError) {
                const code = Number(error.code);
                Log.error(`Ran into a ${code}`);

                if (
                    code >= 500 ||
                    code === 429 ||
                    code === 408
                ) {
                    addError();
                    Log.log(`Added timeout, pausing for ${getPauseFor()}ms`);
                    continue;
                }
            }

            Log.error('Unrecoverable error. Ending process.');

            await ErrorHandler.init(error);

            process.exit(1);
        }
    }
})();