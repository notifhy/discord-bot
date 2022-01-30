import {
    fatalWebhook,
    ownerID,
} from '../../../config.json';
import { HypixelManager } from '../../hypixel/HypixelManager';
import { sendWebHook } from '../../util/utility';
import { Snowflake } from 'discord.js';
import BaseErrorHandler from './BaseErrorHandler';
import ErrorHandler from './ErrorHandler';
import ModuleError from '../ModuleError';

export default class ModuleErrorHandler extends BaseErrorHandler<
    unknown | (ModuleError & { raw: unknown })
> {
    readonly cleanModule: string;
    readonly discordID: string;
    readonly module: string | null;
    readonly raw: unknown | null;

    constructor(
        error: unknown | (ModuleError & { raw: unknown }),
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

    static async init<T>(
        error: T,
        discordID: Snowflake,
        hypixelManager: HypixelManager,
    ) {
        const handler = new ModuleErrorHandler(error, discordID);

        try {
            hypixelManager.errors.addError();

            handler.errorLog();
            await handler.systemNotify();
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

    async systemNotify() {
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
}