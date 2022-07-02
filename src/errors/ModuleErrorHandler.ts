import { Snowflake } from 'discord.js';
import { BaseErrorHandler } from './BaseErrorHandler';
import { ErrorHandler } from './ErrorHandler';
import { ModuleError } from './ModuleError';
import { type Core } from '../core/core';

export class ModuleErrorHandler extends BaseErrorHandler<
unknown | (ModuleError & { raw: unknown })
> {
    public readonly cleanModule: string;

    public readonly discordID: string;

    public readonly module: string | null;

    public readonly raw: unknown | null;

    public constructor(
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

    public static async init<T>(
        error: T,
        discordID: Snowflake,
        core: Core,
    ) {
        const handler = new ModuleErrorHandler(error, discordID);

        try {
            core.error.addGeneric();
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

    private systemNotify() {
        this.sentry
            .setSeverity('error')
            .moduleContext(this.discordID, this.cleanModule)
            .captureException(
                this.raw instanceof Error
                    ? this.raw
                    : this.error,
            );
    }
}