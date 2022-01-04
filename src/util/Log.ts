import { CommandInteraction } from 'discord.js';
import { formattedUnix } from './utility';

export class Log {
    static command(interaction: CommandInteraction, ...text: unknown[]) {
        const time = formattedUnix({ date: true, utc: true });
        const base = `${time} | ${interaction.user.tag} (${interaction.user.id}) |`;

        console.log(base, ...text);
    }

    static error(...text: unknown[]) {
        const time = formattedUnix({ date: true, utc: true });
        const base = `${time} |`;

        console.error(base, ...text);
    }

    static log(...text: unknown[]) {
        const time = formattedUnix({ date: true, utc: true });
        const base = `${time} |`;

        console.log(base, ...text);
    }
}