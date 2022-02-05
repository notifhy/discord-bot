import { auth } from '@googleapis/drive';
import { googleApp } from '../../config.json';
import Constants from './util/Constants';

/* eslint-disable camelcase */

const code = '4/1AX4XfWj8zMbPnp2ArLcshT6lFZPio1cRXdzNGRG-MMxlDb4mw4RIA7BSQqg';

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

        console.log(tokens.refresh_token);
    } else {
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: Constants.scopes,
        });

        console.log(url);
    }
})();