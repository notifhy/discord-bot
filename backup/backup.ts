import {
    code,
    refresh_token as refreshToken,
} from './token.json';
import {
    defaultToken,
    interval,
    parentFolder,
    scopes,
} from './constants';
import { google } from 'googleapis';
import { googleApp } from '../config.json';
import { Log } from '../src/util/Log';
import { setTimeout } from 'node:timers/promises';
import fsPromises from 'node:fs/promises';
import fsSync from 'node:fs';
import ErrorHandler from '../src/errors/handlers/ErrorHandler';
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

const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0],
);

oauth2Client.on('tokens', async ({ expiry_date, refresh_token }) => {
    if (refresh_token) {
        const data = {
            ...defaultToken,
            refresh_token: refresh_token,
        };

        await fsPromises.writeFile(
            `${__dirname}/token.json`,
            JSON.stringify(data),
        );

        Log.log('Refresh token written');
    }

    Log.log(`Access token expires ${expiry_date}`);
});

(async () => {
    //Only create a file if it doesn't exist
    await fsPromises.writeFile(
        `${__dirname}/token.json`,
        JSON.stringify(defaultToken),
        { flag: 'wx' },
    ).catch(() => null);

    if (code) {
        const { tokens } = await oauth2Client.getToken(code);

        oauth2Client.setCredentials(tokens);
    } else if (refreshToken) {
        oauth2Client.setCredentials({
            refresh_token: refreshToken,
        });
    } else {
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
        });

        console.log(url);
        process.exit(0);
    }

    const drive = google.drive({
        version: 'v3',
        auth: oauth2Client,
    });

    while (true) {
        try {
            if (isTimeout()) {
                setTimeout(pauseFor);
            }

            await drive.files.create({
                requestBody: {
                    name: new Date().toLocaleString(),
                    parents: [parentFolder],
                },
                media: {
                    mimeType: 'application/octet-stream',
                    body: fsSync.createReadStream(`${__dirname}/../../database.db`),
                },
            });

            await setTimeout(interval);
        } catch (error) {
            await filterError(error);
        }
    }
})();