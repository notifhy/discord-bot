import { sendWebHook } from '../../utility';
import { DiscordAPIError, Snowflake } from 'discord.js';
import {
    fatalWebhook,
    ownerID,
} from '../../../../config.json';
import BaseErrorHandler from './BaseErrorHandler';
import { RawUserData, UserAPIData, UserData } from '../../../@types/database';
import { SQLiteWrapper } from '../../../database';
import Constants from '../../Constants';
import { Field } from '../../../@types/locales';
import ModuleError from '../ModuleError';

export class ModuleErrorHandler extends BaseErrorHandler {
    readonly discordID: string;
    readonly module: string;

    constructor(
        error: unknown,
        discordID: Snowflake,
    ) {
        super(error);
        this.discordID = discordID;
        this.module = error instanceof ModuleError
            ? error.module
            : 'Unknown';

        this.errorLog();
        this.statusCode();
    }

    async disableAllModules(message: Field) {
        const userAPIData = (
            await SQLiteWrapper.getUser({
                discordID: this.discordID,
                table: Constants.tables.api,
                columns: ['modules'],
                allowUndefined: false,
            })
        ) as UserAPIData;

        const index = userAPIData.modules.indexOf(this.module);
        let modules;

        if (index >= 0) { //why
            userAPIData.modules.splice(index, 1);
        } else {
            modules = [];
        }

        await SQLiteWrapper.updateUser<
            Partial<UserAPIData>,
            Partial<UserAPIData>
        >({
            discordID: this.discordID,
            table: Constants.tables.api,
            data: {
                modules: modules ?? userAPIData.modules,
            },
        });

        const userData = (await SQLiteWrapper.getUser<RawUserData, UserData>({
            discordID: this.discordID,
            table: Constants.tables.users,
            columns: ['systemMessage'],
            allowUndefined: false,
        })) as UserData;

        await SQLiteWrapper.updateUser<
            Partial<UserData>,
            Partial<UserData>
        >({
            discordID: this.discordID,
            table: Constants.tables.api,
            data: {
                systemMessage: [
                    ...userData.systemMessage,
                    message,
                ],
            },
        });
    }

    private async statusCode() {
        try {
            if (this.error instanceof DiscordAPIError) {
                let message: Field | undefined;
                switch (this.error.code) {
                    case 10003: message = { //Unknown channel
                        name: 'Cannot send message',
                        value: 'blah blah blah',
                    };
                    break;
                    case 10013: message = { //Unknown user
                        name: 'Cannot send message',
                        value: 'blah blah blah',
                    };
                    break;
                    case 50007: message = { //Cannot send messages to this user
                        name: 'Cannot send message',
                        value: 'blah blah blah',
                    };
                    break;
                    case 50013: message = { //You lack permissions to perform that action
                        name: 'Cannot send message',
                        value: 'blah blah blah',
                    };
                    break;
                    //No default
                }

                if (message) {
                    await this.disableAllModules(message);
                }
            }
        } catch (error) {
            this.log('Failed to parse Discord API error code', error);
        }
    }

    private errorLog() {
        this.log(`User: ${this.discordID}`, `Module: ${this.module}`, this.error);
    }

    async systemNotify() {
        const identifier = this.errorEmbed()
            .setTitle('Unexpected Error')
            .addField('User', this.discordID)
            .addField('Module', this.module);

        await sendWebHook({
            content: `<@${ownerID.join('><@')}>`,
            embeds: [
                identifier,
                this.errorStackEmbed(this.error),
            ],
            webhook: fatalWebhook,
            suppressError: true,
        });
    }
}