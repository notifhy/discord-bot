import {
    auth,
    drive as googleDrive,
} from '@googleapis/drive';
import { backup as Constants } from '../util/Constants';
import { googleApp, refreshToken } from '../../config.json';
import { Log } from '../util/Log';
import { setTimeout } from 'node:timers/promises';
import fsSync from 'node:fs';
import ErrorHandler from '../NotifHy/errors/handlers/ErrorHandler';
import process from 'node:process';
import Timeout from './Timeout';

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
    filterError,
    isTimeout,
    pauseFor,
} = new Timeout();

const {
    client_id,
    client_secret,
    redirect_uris,
} = googleApp.installed;

const oauth2Client = new auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0],
);

oauth2Client.on('tokens', ({ expiry_date }) => {
    Log.log(`New access token expires ${expiry_date}`);
});

(async () => {
    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    });

    const drive = googleDrive({
        version: 'v3',
        auth: oauth2Client,
    });

    while (true) {
        try {
            if (isTimeout()) {
                setTimeout(pauseFor);
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
            await filterError(error);
        }
    }
})();