import { CommandInteraction } from 'discord.js';
import { UserData } from '../@types/database';
import { formattedUnix } from './utility';

export class Log {
    private static base(type: string) {
        const time = formattedUnix({ date: true, utc: true });
        return `${time} [${type}]`;
    }

    static error(...text: unknown[]) {
        console.error(this.base('ERROR'), ...text);
    }

    static interaction(interaction: CommandInteraction, ...text: unknown[]) {
        console.log(this.base('INTERACTION'), interaction.id, interaction.user.id, ...text);
    }

    static log(...text: unknown[]) {
        console.log(this.base('LOG'), ...text);
    }

    static module(module: string, user: UserData, ...text: unknown[]) {
        const moduleName = `[${module.toUpperCase()}]`;
        console.log(this.base('MODULES'), moduleName, user.discordID, ...text);
    }

    static request(...text: unknown[]) {
        console.log(this.base('REQUEST'), ...text);
    }
}