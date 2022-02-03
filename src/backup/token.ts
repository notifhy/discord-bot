import { auth } from '@googleapis/drive';
import { backup as Constants } from '../util/Constants';
import { googleApp } from '../../config.json';

/* eslint-disable camelcase */

const code = '';

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

(async () => {
    if (code) {
        const { tokens } = await oauth2Client.getToken(code);

        console.log(tokens.access_token);
    } else {
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: Constants.scopes,
        });

        console.log(url);
    }
})();