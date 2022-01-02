import type { Field } from '../../../@types/locales';
import type {
    UserAPIData,
    UserData,
} from '../../../@types/database';
import {
    Constants as DiscordConstants,
    DiscordAPIError,
    Snowflake,
} from 'discord.js';
import {
    fatalWebhook,
    ownerID,
} from '../../../../config.json';
import { RegionLocales } from '../../../../locales/localesHandler';
import { sendWebHook } from '../../utility';
import { SQLite } from '../../SQLite';
import BaseErrorHandler from './BaseErrorHandler';
import Constants from '../../Constants';
import ModuleError from '../ModuleError';

export default class ModuleErrorHandler extends BaseErrorHandler {
    readonly cleanModule: string;
    readonly discordID: string;
    readonly module: string;

    constructor(
        error: ModuleError,
        discordID: Snowflake,
    ) {
        super(error);
        this.cleanModule = error.cleanModule;

        this.discordID = discordID;
        this.module = error.module;

        this.errorLog();
        this.statusCode();
    }

    async disableModules(message: Field) {
        const userAPIData = (
            await SQLite.getUser({
                discordID: this.discordID,
                table: Constants.tables.api,
                columns: ['modules'],
                allowUndefined: false,
            })
        ) as UserAPIData;

        const index = userAPIData.modules.indexOf(this.module);

        userAPIData.modules.splice(index, 1);

        await SQLite.updateUser<UserAPIData>({
            discordID: this.discordID,
            table: Constants.tables.api,
            data: {
                modules: userAPIData.modules,
            },
        });

        const userData = (
            await SQLite.getUser<UserData>({
                discordID: this.discordID,
                table: Constants.tables.users,
                columns: ['systemMessage'],
                allowUndefined: false,
            },
        )) as UserData;

        await SQLite.updateUser<UserData>({
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
                const userData = (
                    await SQLite.getUser<UserData>({
                        discordID: this.discordID,
                        table: Constants.tables.users,
                        columns: ['language'],
                        allowUndefined: false,
                    },
                )) as UserData;

                const locale = RegionLocales.locale(userData.language).errors.moduleErrors;
                const { replace } = RegionLocales;
                const cleanModule = { cleanModule: this.cleanModule };
                let message: Field | undefined;

                switch (this.error.raw.code) {
                    case DiscordConstants.APIErrors.UNKNOWN_CHANNEL: message = { //Unknown channel
                        name: replace(locale[10003].name, cleanModule),
                        value: replace(locale[10003].value, cleanModule),
                    };
                    break;
                    case DiscordConstants.APIErrors.UNKNOWN_USER: message = { //Unknown user
                        name: replace(locale[10013].name, cleanModule),
                        value: replace(locale[10013].value, cleanModule),
                    };
                    break;
                    case DiscordConstants.APIErrors.CANNOT_MESSAGE_USER: message = { //Cannot send messages to this user
                        name: replace(locale[50007].name, cleanModule),
                        value: replace(locale[50007].value, cleanModule),
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
            const message = 'Failed to handle a Discord API error';
            this.log(message, error);

             const stackEmbed = this.errorStackEmbed(error);

            await sendWebHook({
                content: `<@${ownerID.join('><@')}> ${message}.`,
                embeds: [stackEmbed],
                webhook: fatalWebhook,
                suppressError: true,
            });
        }
    }

    private errorLog() {
        this.log(
            `User: ${this.discordID}`,
            `Module: ${this.cleanModule}`,
            (this.error as ModuleError)?.stack ??
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