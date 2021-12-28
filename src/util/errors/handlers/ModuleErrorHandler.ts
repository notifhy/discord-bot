import type { Field } from '../../../@types/locales';
import type { RawUserData, UserAPIData, UserData } from '../../../@types/database';
import { Constants as DiscordConstants, DiscordAPIError, Snowflake } from 'discord.js';
import {
    fatalWebhook,
    ownerID,
} from '../../../../config.json';
import { sendWebHook } from '../../utility';
import { SQLiteWrapper } from '../../../database';
import BaseErrorHandler from './BaseErrorHandler';
import Constants from '../../Constants';
import ModuleError from '../ModuleError';

export class ModuleErrorHandler extends BaseErrorHandler {
    readonly cleanModule: string;
    readonly discordID: string;
    readonly module: string;

    constructor(
        error: unknown,
        discordID: Snowflake,
    ) {
        super(error);
        this.cleanModule = error instanceof ModuleError
            ? error.cleanModule
            : 'Unknown';

        this.discordID = discordID;
        this.module = error instanceof ModuleError
            ? error.module
            : 'placeholder';

        this.errorLog();
        this.statusCode();
    }

    async disableModules(message: Field) {
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

        if (index >= 0) { //thanks javascript
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
                modules: modules ??
                userAPIData.modules,
            },
        });

        const userData = (
            await SQLiteWrapper.getUser<RawUserData, UserData>({
                discordID: this.discordID,
                table: Constants.tables.users,
                columns: ['systemMessage'],
                allowUndefined: false,
            },
        )) as UserData;

        await SQLiteWrapper.updateUser<
            Partial<UserData>,
            Partial<UserData>
        >({
            discordID: this.discordID,
            table: Constants.tables.users,
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
            if (
                this.error instanceof ModuleError &&
                this.error.raw instanceof DiscordAPIError
            ) {
                let message: Field | undefined;

                switch (this.error.raw.code) {
                    case DiscordConstants.APIErrors.UNKNOWN_CHANNEL: message = { //Unknown channel
                        name: `${this.cleanModule} Module Disabled`,
                        value: `The ${this.cleanModule} Module was disabled because the channel set was not fetchable.`,
                    };
                    break;
                    case DiscordConstants.APIErrors.UNKNOWN_USER: message = { //Unknown user
                        name: `${this.cleanModule} Module Disabled`,
                        value: `The ${this.cleanModule} Module was disabled because your account was not fetchable.`,
                    };
                    break;
                    case DiscordConstants.APIErrors.CANNOT_MESSAGE_USER: message = { //Cannot send messages to this user
                        name: `${this.cleanModule} Module Disabled`,
                        value: `The ${this.cleanModule} Module was disabled because the bot was unable to DM you. Please check your privacy settings and enable DMs. Then, reenable this module with /modules rewards`,
                    };
                    break;
                    //No default
                }

                if (message) {
                    await this.disableModules(message);
                }

                this.log('Handled a Discord API error', this.error.raw.code);
            }
        } catch (error) {
            this.log('Failed to handle a Discord API error', error);
        }
    }

    private errorLog() {
        this.log(
            `User: ${this.discordID}`,
            `Module: ${this.cleanModule}`,
            (this.error as Error)?.stack ??
                this.error,
        );
    }

    async systemNotify() {
        const identifier = this.errorEmbed()
            .setTitle('Unexpected Error')
            .addField('User', this.discordID)
            .addField('Module', this.cleanModule);

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