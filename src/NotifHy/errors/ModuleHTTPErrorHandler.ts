import {
    Client,
    DiscordAPIError,
    Constants as DiscordConstants,
    Snowflake,
    HTTPError,
} from 'discord.js';
import type {
    UserAPIData,
    UserData,
} from '../@types/database';
import { BaseErrorHandler } from './BaseErrorHandler';
import { Constants } from '../utility/Constants';
import { ErrorHandler } from './ErrorHandler';
import {
    fatalWebhook,
    ownerID,
} from '../../../config.json';
import { ModuleError } from './ModuleError';
import { RegionLocales } from '../locales/RegionLocales';
import { SQLite } from '../utility/SQLite';
import { Locale } from '../@types/locales';
import {
    sendWebHook,
    BetterEmbed,
    timestamp,
    arrayRemove,
} from '../utility/utility';

export class ModuleHTTPErrorHandler extends BaseErrorHandler<
DiscordAPIError
| HTTPError
| (Omit<ModuleError, 'raw'> &
{ raw: DiscordAPIError | HTTPError })
> {
    readonly cleanModule: string;

    readonly client: Client;

    readonly discordID: string;

    readonly module: string | null;

    readonly raw: unknown | null;

    readonly userData: UserData;

    readonly locale: Locale['errors']['moduleErrors'];

    constructor(
        client: Client,
        discordID: Snowflake,
        error: DiscordAPIError
        | HTTPError
        | (Omit<ModuleError, 'raw'> &
        { raw: DiscordAPIError | HTTPError }),
    ) {
        super(error);

        this.cleanModule = error instanceof ModuleError
            ? error.cleanModule
            : 'None';

        this.client = client;

        this.discordID = discordID;

        this.module = error instanceof ModuleError
            ? error.module
            : null;

        this.raw = error instanceof ModuleError
            ? error.raw
            : null;

        this.userData = SQLite.getUser<UserData>({
            discordID: this.discordID,
            table: Constants.tables.users,
            allowUndefined: false,
            columns: [
                'locale',
                'systemMessages',
            ],
        });

        this.locale = RegionLocales
            .locale(this.userData.locale)
            .errors
            .moduleErrors;
    }

    static async init(
        client: Client,
        discordID: Snowflake,
        error: DiscordAPIError
        | HTTPError
        | (ModuleError
        & { raw: DiscordAPIError | HTTPError }),
    ) {
        const handler = new ModuleHTTPErrorHandler(client, discordID, error);

        try {
            handler.errorLog();
            await handler.systemNotify();

            if (error instanceof DiscordAPIError) {
                await handler.handleDiscordAPICode(error);
            } else if (
                error instanceof ModuleError
                && error.raw instanceof DiscordAPIError
            ) {
                await handler.handleDiscordAPICode(error.raw);
            } else {
                await handler.handleHTTPError();
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
            .addFields(
                {
                    name: 'User',
                    value: this.discordID,
                },
                {
                    name: 'Module',
                    value: this.cleanModule,
                },
            );

        await sendWebHook({
            content: `<@${ownerID.join('><@')}>`,
            embeds: [identifier],
            files: [this.stackAttachment],
            webhook: fatalWebhook,
            suppressError: true,
        });
    }

    private async handleDiscordAPICode(error: DiscordAPIError) {
        const { replace } = RegionLocales;
        const { APIErrors } = DiscordConstants;

        const cleanModule = {
            cleanModule: this.error instanceof ModuleError
                ? this.cleanModule
                : 'All Modules',
        };

        const message = {
            name: replace(
                this.locale[
                    error.code as unknown as keyof Omit<typeof this.locale, 'alert'>
                ].name,
                cleanModule,
            ),
            value: replace(
                this.locale[
                    error.code as unknown as keyof Omit<typeof this.locale, 'alert'>
                ].value,
                cleanModule,
            ),
        };

        switch (error.code) {
            case APIErrors.UNKNOWN_CHANNEL: // Unknown channel
            case APIErrors.MISSING_ACCESS: // Unable to access channel, server, etc.
            case APIErrors.MISSING_PERMISSIONS: { // Missing permission(s)
                try {
                    const user = await this.client.users.fetch(this.discordID);

                    const { footer, title } = this.locale.alert;

                    const alertEmbed = new BetterEmbed({ text: footer })
                        .setTitle(title)
                        .addFields({
                            name: message.name,
                            value: message.value,
                        });

                    await user.send({ embeds: [alertEmbed] });
                } catch (error3) {
                    this.log('Failed to send DM alert', error3);
                }
                // fall through - eslint
            }
            case APIErrors.UNKNOWN_USER: // Unknown user
            case APIErrors.CANNOT_MESSAGE_USER: { // Cannot send messages to this user
                message.name = `${timestamp(Date.now(), 'D')} - ${message.name}`; // Update locale

                this.log('Attempting to disable module(s)');

                const userAPIData = SQLite.getUser<UserAPIData>({
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

                SQLite.updateUser<UserAPIData>({
                    discordID: this.discordID,
                    table: Constants.tables.api,
                    data: {
                        modules: modules,
                    },
                });

                SQLite.updateUser<UserData>({
                    discordID: this.discordID,
                    table: Constants.tables.users,
                    data: {
                        systemMessages: [
                            ...this.userData.systemMessages,
                            message,
                        ],
                    },
                });

                this.log('Handled Discord API error', error.code);
            }
                break;
            default: this.handleHTTPError();
        }
    }

    private async handleHTTPError() {
        try {
            const user = await this.client.users.fetch(this.discordID);

            const { footer, title } = this.locale.alert;

            const message = {
                name: this.locale.http.name,
                value: this.locale.http.value,
            };

            const alertEmbed = new BetterEmbed({ text: footer })
                .setTitle(title)
                .addFields(message);

            const settledPromises = await Promise.allSettled([
                user.send({ embeds: [alertEmbed] }),
                SQLite.updateUser<UserData>({
                    discordID: this.discordID,
                    table: Constants.tables.users,
                    data: {
                        systemMessages: [
                            ...this.userData.systemMessages,
                            message,
                        ],
                    },
                }),
            ]);

            // eslint-disable-next-line no-restricted-syntax
            for (const promise of settledPromises) {
                if (promise.status === 'rejected') {
                    this.log('Failed to handle part of the HTTPError due to', promise.reason);
                }
            }
        } catch (error3) {
            this.log('Failed to send DM alert');
            await ErrorHandler.init(error3, this.incidentID);
        }
    }
}