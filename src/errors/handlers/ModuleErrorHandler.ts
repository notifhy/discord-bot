import type { Field } from '../../@types/locales';
import type {
    UserAPIData,
    UserData,
} from '../../@types/database';
import {
    Constants as DiscordConstants,
    DiscordAPIError,
    Snowflake,
} from 'discord.js';
import {
    fatalWebhook,
    ownerID,
} from '../../../config.json';
import { RegionLocales } from '../../../locales/RegionLocales';
import { arrayRemove, sendWebHook, timestamp } from '../../util/utility';
import { SQLite } from '../../util/SQLite';
import BaseErrorHandler from './BaseErrorHandler';
import Constants from '../../util/Constants';
import ModuleError from '../ModuleError';

export default class ModuleErrorHandler extends BaseErrorHandler {
    readonly cleanModule: string;
    readonly discordID: string;
    readonly module: string;
    readonly raw: unknown;

    constructor(
        error: ModuleError,
        discordID: Snowflake,
    ) {
        super(error);
        this.cleanModule = error.cleanModule;

        this.discordID = discordID;
        this.module = error.module;
        this.raw = error.raw;

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

        const modules = arrayRemove(userAPIData.modules, this.module);

        await SQLite.updateUser<UserAPIData>({
            discordID: this.discordID,
            table: Constants.tables.api,
            data: {
                modules: modules as string[],
            },
        });

        const userData = (
            await SQLite.getUser<UserData>({
                discordID: this.discordID,
                table: Constants.tables.users,
                columns: ['systemMessages'],
                allowUndefined: false,
            },
        )) as UserData;

        await SQLite.updateUser<UserData>({
            discordID: this.discordID,
            table: Constants.tables.users,
            data: {
                systemMessages: [
                    ...userData.systemMessages,
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
                        allowUndefined: false,
                        columns: ['locale'],
                    },
                )) as UserData;

                const locale = RegionLocales
                    .locale(userData.locale)
                    .errors
                    .moduleErrors;

                const { replace } = RegionLocales;
                const { APIErrors } = DiscordConstants;

                const cleanModule = { cleanModule: this.cleanModule };
                let message: Field | undefined;

                switch (this.error.raw.code) {
                    case APIErrors.UNKNOWN_CHANNEL: //Unknown channel
                    case APIErrors.UNKNOWN_USER: //Unknown user
                    case APIErrors.MISSING_ACCESS: //Unable to access channel, server, etc.
                    case APIErrors.CANNOT_MESSAGE_USER: //Cannot send messages to this user
                    case APIErrors.MISSING_PERMISSIONS: message = { //Missing permission(s)
                        name:
                            replace(locale[this.error.raw.code].name,
                            cleanModule),
                        value:
                            replace(locale[this.error.raw.code].value,
                            cleanModule),
                    };
                    break;
                    //No default
                }

                if (message) {
                    message.name = `${timestamp(Date.now(), 'D')} - ${message.name}`;
                    this.log('Disabling module');
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
            this.raw instanceof Error
                ? this.raw
                : this.error,
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
                this.errorStackEmbed(
                    this.raw instanceof Error
                        ? this.raw
                        : this.error,
                ),
            ],
            webhook: fatalWebhook,
            suppressError: true,
        });
    }
}