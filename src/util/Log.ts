import { CommandInteraction } from 'discord.js';
import { formattedUnix } from './utility';

export class Log {
    private static base() {
        const time = formattedUnix({ date: true, utc: true });
        return `${time} |`;
    }

    static command(interaction: CommandInteraction, ...text: unknown[]) {
        const time = formattedUnix({ date: true, utc: true });
        const base = `${time} | ${interaction.user.tag} (${interaction.user.id}) |`;

        console.log(base, ...text);
    }

    static error(...text: unknown[]) {
        console.error(this.base(), ...text);
    }

    static log(...text: unknown[]) {
        console.log(this.base(), ...text);
    }

    static warn(...text: unknown[]) {
        console.warn(this.base(), ...text);
    }
}