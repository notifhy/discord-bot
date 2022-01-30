import {
    arrayRemove,
    sendWebHook,
    timestamp,
} from '../../util/utility';
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
import { SQLite } from '../../util/SQLite';
import { UserAPIData, UserData } from '../../@types/database';
import BaseErrorHandler from './BaseErrorHandler';
import Constants from '../../util/Constants';
import ErrorHandler from './ErrorHandler';
import ModuleError from '../ModuleError';

export default class ModuleDiscordErrorHandler extends BaseErrorHandler<
    DiscordAPIError | (Omit<ModuleError, 'raw'> & { raw: DiscordAPIError })
> {
    readonly cleanModule: string;
    readonly discordID: string;
    readonly module: string | null;
    readonly raw: unknown | null;

    constructor(
        error: DiscordAPIError | (Omit<ModuleError, 'raw'> & { raw: DiscordAPIError }),
        discordID: Snowflake,
    ) {
        super(error);

        this.cleanModule = error instanceof ModuleError
            ? error.cleanModule
            : 'None';

        this.discordID = discordID;

        this.module = error instanceof ModuleError
            ? error.module
            : null;

        this.raw = error instanceof ModuleError
            ? error.raw
            : null;
    }

    static async init(
        error: DiscordAPIError | (ModuleError & { raw: DiscordAPIError }),
        discordID: Snowflake,
    ) {
        const handler = new ModuleDiscordErrorHandler(error, discordID);

        try {
            handler.errorLog();
            await handler.systemNotify();

            if (error instanceof DiscordAPIError) {
                await handler.handleDiscordAPICode(error);
            } else {
                await handler.handleDiscordAPICode(error.raw);
            }
        } catch (error2) {
            await ErrorHandler.init(error2, handler.incidentID);
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

    private async systemNotify() {
        const identifier = this.baseErrorEmbed()
            .setTitle('Unexpected Error')
            .addFields([
                {
                    name: 'User',
                    value: this.discordID,
                },
                {
                    name: 'Module',
                    value: this.cleanModule,
                },
            ]);

        await sendWebHook({
            content: `<@${ownerID.join('><@')}>`,
            embeds: [identifier],
            files: [this.stackAttachment],
            webhook: fatalWebhook,
            suppressError: true,
        });
    }

    private async handleDiscordAPICode(error: DiscordAPIError) {
        const userData = await SQLite.getUser<UserData>({
            discordID: this.discordID,
            table: Constants.tables.users,
            allowUndefined: false,
            columns: [
                'locale',
                'systemMessages',
            ],
        });

        const locale = RegionLocales
            .locale(userData.locale)
            .errors
            .moduleErrors;

        const { replace } = RegionLocales;
        const { APIErrors } = DiscordConstants;

        switch (error.code) {
            case APIErrors.UNKNOWN_CHANNEL: //Unknown channel
            case APIErrors.UNKNOWN_USER: //Unknown user
            case APIErrors.MISSING_ACCESS: //Unable to access channel, server, etc.
            case APIErrors.CANNOT_MESSAGE_USER: //Cannot send messages to this user
            case APIErrors.MISSING_PERMISSIONS: { //Missing permission(s)
                const cleanModule = {
                    cleanModule: this.error instanceof ModuleError
                        ? this.cleanModule
                        : 'All Modules',
                };

                const message = {
                    name: replace(locale[error.code].name,
                        cleanModule),
                    value: replace(locale[error.code].value,
                        cleanModule),
                };

                message.name = `${timestamp(Date.now(), 'D')} - ${message.name}`; //Update locale

                this.log('Attempting to disable module(s)');

                const userAPIData = await SQLite.getUser<UserAPIData>({
                    discordID: this.discordID,
                    table: Constants.tables.api,
                    columns: ['modules'],
                    allowUndefined: false,
                });

                const modules = arrayRemove(
                    userAPIData.modules,
                    this.module ?? userAPIData.modules,
                );

                this.log('New modules:', modules);

                await SQLite.updateUser<UserAPIData>({
                    discordID: this.discordID,
                    table: Constants.tables.api,
                    data: {
                        modules: modules,
                    },
                });

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

                this.log('Handled Discord API error', error.code);
            }
            break;
            //No default
        }
    }
}