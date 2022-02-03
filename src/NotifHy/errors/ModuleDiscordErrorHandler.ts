import {
    arrayRemove,
    BetterEmbed,
    sendWebHook,
    timestamp,
} from '../../util/utility';
import {
    Client,
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
import BaseErrorHandler from '../../util/errors/BaseErrorHandler';
import Constants from '../../util/Constants';
import ErrorHandler from '../../util/errors/ErrorHandler';
import ModuleError from './ModuleError';

export default class ModuleDiscordErrorHandler extends BaseErrorHandler<
    DiscordAPIError | (Omit<ModuleError, 'raw'> & { raw: DiscordAPIError })
> {
    readonly cleanModule: string;
    readonly client: Client;
    readonly discordID: string;
    readonly module: string | null;
    readonly raw: unknown | null;

    constructor(
        client: Client,
        discordID: Snowflake,
        error: DiscordAPIError | (Omit<ModuleError, 'raw'> & { raw: DiscordAPIError }),
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
    }

    static async init(
        client: Client,
        discordID: Snowflake,
        error: DiscordAPIError | (ModuleError & { raw: DiscordAPIError }),
    ) {
        const handler = new ModuleDiscordErrorHandler(client, discordID, error);

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

        const cleanModule = {
            cleanModule: this.error instanceof ModuleError
                ? this.cleanModule
                : 'All Modules',
        };

        const message = {
            name: replace(
                locale[
                    error.code as unknown as keyof Omit<typeof locale, 'alert'>
                ].name,
                cleanModule),
            value: replace(
                locale[
                    error.code as unknown as keyof Omit<typeof locale, 'alert'>
                ].value,
                cleanModule,
            ),
        };

        switch (error.code) {
            case APIErrors.UNKNOWN_CHANNEL: //Unknown channel
            case APIErrors.MISSING_ACCESS: //Unable to access channel, server, etc.
            case APIErrors.MISSING_PERMISSIONS: { //Missing permission(s)
                try {
                    const user = await this.client.users.fetch(this.discordID);

                    const { footer, title } = locale.alert;

                    const alertEmbed = new BetterEmbed({ text: footer })
                        .setTitle(title)
                        .addField(message.name, message.value);

                    await user.send({ embeds: [alertEmbed] });
                } catch (error3) {
                    this.log('Failed to send DM alert');
                    await ErrorHandler.init(error3, this.incidentID);
                }
                //falls through - eslint
            }
            case APIErrors.UNKNOWN_USER: //Unknown user
            case APIErrors.CANNOT_MESSAGE_USER: { //Cannot send messages to this user
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