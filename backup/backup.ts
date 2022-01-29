import { code, refresh_token as refreshToken } from './token.json';
import { google } from 'googleapis';
import { googleApp } from '../config.json';
import { Log } from '../src/util/Log';
import { setTimeout } from 'node:timers/promises';
import fsPromises from 'node:fs/promises';
import fsSync from 'node:fs';
import ErrorHandler from '../src/errors/handlers/ErrorHandler';
import process from 'node:process';

/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */

process.on('exit', exitCode => {
    Log.log(`Exiting with code ${exitCode}`);
});

process.on('unhandledRejection', async error => {
    Log.error('unhandledRejection', error);
    await ErrorHandler.init(error);
    process.exit(1);
});

process.on('uncaughtException', async error => {
    Log.error('uncaughtException', error);
    await ErrorHandler.init(error);
    process.exit(1);
});

const defaultToken = {
    code: '',
    refresh_token: '',
};

const scopes = [
    'https://www.googleapis.com/auth/drive',
];

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
    console.log('c');
    if (refresh_token) {
        const data = {
            code: '',
            refresh_token: refresh_token,
        };

        await fsPromises.writeFile(
            `${__dirname}/token.json`,
            JSON.stringify(data),
        );
    }

    Log.log('New token, expires', expiry_date);
});

(async () => {
    //Only create a file if it doesn't exist
    await fsPromises.writeFile(
        `${__dirname}/token.json`,
        JSON.stringify(defaultToken),
        { flag: 'w' },
    ).catch(() => null);

    if (code) {
        const { tokens } =
            await oauth2Client.getToken(code);

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
        const response = await drive.files.create({
            requestBody: {
                name: new Date().toLocaleString(),
                parents: ['15KvOYG6r6To_fgXf5DOkIT6aEcUtT5rg'],
            },
            media: {
                mimeType: 'application/octet-stream',
                body: fsSync.createReadStream(`${__dirname}/../../database.db`),
            },
            fields: 'id',
        });

        Log.log(response.status, response.statusText);

        await setTimeout(1000 * 60 * 30);
    }
})();