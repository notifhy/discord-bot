import type { users as User } from '@prisma/client';
import { LogLevel } from '@sapphire/framework';
import { Logger as LoggerPlugin } from '@sapphire/plugin-logger';
import type { Interaction } from 'discord.js';

type Context = Object;

export class Logger extends LoggerPlugin {
    public override trace(context: Context, ...values: readonly unknown[]): void {
        this.write(LogLevel.Trace, this.className(context), ...values);
    }

    public override debug(context: Context, ...values: readonly unknown[]): void {
        this.write(LogLevel.Debug, this.className(context), ...values);
    }

    public override info(context: Context, ...values: readonly unknown[]): void {
        this.write(LogLevel.Info, this.className(context), ...values);
    }

    public override warn(context: Context, ...values: readonly unknown[]): void {
        this.write(LogLevel.Warn, this.className(context), ...values);
    }

    public override error(context: Context, ...values: readonly unknown[]): void {
        this.write(LogLevel.Error, this.className(context), ...values);
    }

    public override fatal(context: Context, ...values: readonly unknown[]): void {
        this.write(LogLevel.Fatal, this.className(context), ...values);
    }

    public static interactionLogContext(interaction: Interaction) {
        return `Interaction: ${interaction.id}. User: ${interaction.user.id}.`;
    }

    public static moduleContext(user: User) {
        return `User: ${user.id}.`;
    }

    private className(context: Context) {
        if (typeof context !== 'object' && typeof context !== 'function') {
            return context;
        }

        const name = context instanceof Function ? context.name : context.constructor.name;
        return `${name}:`;
    }
}

declare module '@sapphire/framework' {
    interface ILogger {
        trace(context: Context, ...values: readonly unknown[]): void;
        debug(context: Context, ...values: readonly unknown[]): void;
        info(context: Context, ...values: readonly unknown[]): void;
        warn(context: Context, ...values: readonly unknown[]): void;
        error(context: Context, ...values: readonly unknown[]): void;
        fatal(context: Context, ...values: readonly unknown[]): void;
    }
}
