import { CommandInteraction } from 'discord.js';
import { formattedUnix } from './utility';

export class Log {
    private static base(type: string) {
        const time = formattedUnix({ date: true, utc: true });
        return `${time} [${type}]`;
    }

    static command(interaction: CommandInteraction, ...text: unknown[]) {
        console.log(this.base('INTERACTION'), interaction.user.id, ...text);
    }

    static debug(...text: unknown[]) {
        console.warn(this.base('DEBUG'), ...text);
    }

    static error(...text: unknown[]) {
        console.error(this.base('ERROR'), ...text);
    }

    static log(...text: unknown[]) {
        console.log(this.base('LOG'), ...text);
    }

    static warn(...text: unknown[]) {
        console.warn(this.base('WARN'), ...text);
    }
}