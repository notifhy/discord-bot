import {
    type Client,
    DiscordAPIError,
    type HTTPError,
    type Snowflake,
    RESTJSONErrorCodes,
} from 'discord.js';
import {
    type UserAPIData,
    type UserData,
} from '../@types/database';
import { type Locale } from '../@types/locales';
import { BaseErrorHandler } from './BaseErrorHandler';
import { ErrorHandler } from './ErrorHandler';
import { RegionLocales } from '../locales/RegionLocales';
import { ModuleError } from './ModuleError';
import { Constants } from '../utility/Constants';
import { SQLite } from '../utility/SQLite';
import {
    arrayRemove,
    BetterEmbed,
    timestamp,
} from '../utility/utility';

export class ModuleHTTPErrorHandler extends BaseErrorHandler<
DiscordAPIError
| HTTPError
| (Omit<ModuleError, 'raw'> &
{ raw: DiscordAPIError | HTTPError })
> {
    public readonly cleanModule: string;

    public readonly client: Client;

    public readonly discordID: string;

    public readonly module: string | null;

    public readonly raw: unknown | null;

    public readonly userData: UserData;

    public readonly locale: Locale['errors']['moduleErrors'];

    public constructor(
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

    public static async init(
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
        this.sentry
            .setSeverity('error')
            .moduleContext(this.discordID, this.cleanModule)
            .captureException(
                this.raw instanceof Error
                    ? this.raw
                    : this.error,
            );
    }

    private async handleDiscordAPICode(error: DiscordAPIError) {
        const { replace } = RegionLocales;

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
            case RESTJSONErrorCodes.UnknownChannel:
            case RESTJSONErrorCodes.MissingAccess:
            case RESTJSONErrorCodes.MissingPermissions: {
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
            case RESTJSONErrorCodes.UnknownUser:
            case RESTJSONErrorCodes.CannotSendMessagesToThisUser: {
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