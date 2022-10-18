import { container } from '@sapphire/framework';
import {
    type AwaitMessageCollectorOptionsParams,
    type CommandInteraction,
    Formatters,
    type Interaction,
    MessageActionRow,
    type MessageComponentTypeResolvable,
    type TextBasedChannel,
} from 'discord.js';
import { Time } from '../enums/Time';
import { Options } from './Options';

export async function awaitComponent<T extends MessageComponentTypeResolvable>(
    channel: TextBasedChannel,
    options: AwaitMessageCollectorOptionsParams<T, true>,
) {
    try {
        return await channel.awaitMessageComponent<T>(options);
    } catch (error) {
        if (
            error instanceof Error
            && (error as Error & { code: string })?.code === 'INTERACTION_COLLECTOR_ERROR'
        ) {
            return null;
        }

        throw error;
    }
}

export function cleanDate(ms: number | Date): string | null {
    const newDate = new Date(ms);
    if (ms < 0 || !isDate(newDate)) {
        return null;
    }

    const day = newDate.getDate();

    const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(newDate);

    const year = newDate.getFullYear();

    return `${month} ${day}, ${year}`;
}

export function cleanLength(ms: number | null): string | null {
    if (!isNumber(ms)) {
        return null;
    }

    let newMS = Math.floor(ms / Time.Second) * Time.Second;

    const days = Math.floor(newMS / Time.Day);
    newMS -= days * Time.Day;
    const hours = Math.floor(newMS / Time.Hour);
    newMS -= hours * Time.Hour;
    const minutes = Math.floor(newMS / Time.Minute);
    newMS -= minutes * Time.Minute;
    const seconds = Math.floor(newMS / Time.Second);

    if (days !== 0) {
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    if (hours !== 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    if (minutes !== 0) {
        return `${minutes}m ${seconds}s`;
    }

    return `${seconds}s`;
}

export function cleanRound(number: number, decimals?: number) {
    const decimalsFactor = 10 ** (decimals ?? 2);
    return Math.round(number * decimalsFactor) / decimalsFactor;
}

// Taken from https://stackoverflow.com/a/13016136 under CC BY-SA 3.0 matching ISO 8601
export function createOffset(date = new Date()): string {
    function pad(value: number) {
        return value < 10 ? `0${value}` : value;
    }

    const sign = date.getTimezoneOffset() > 0 ? '-' : '+';
    const offset = Math.abs(date.getTimezoneOffset());
    const hours = pad(Math.floor(offset / 60));
    const minutes = pad(offset % 60);

    return `${sign + hours}:${minutes}`;
}

export function disableComponents(messageActionRows: MessageActionRow[]) {
    const actionRows = messageActionRows.map((row) => new MessageActionRow(row));

    actionRows.forEach((actionRow) => {
        actionRow.components.forEach((component) => {
            component.setDisabled();
        });
    });

    return actionRows;
}

export function formattedUnix({
    ms = Date.now(),
    date = false,
    utc = true,
}: {
    ms?: number | Date;
    date: boolean;
    utc: boolean;
}): string | null {
    const newDate = new Date(ms);
    if (ms < 0 || !isDate(newDate)) {
        return null;
    }

    const utcString = utc === true ? `UTC${createOffset()} ` : '';

    const timeString = newDate.toLocaleTimeString('en-IN', { hour12: true });

    const dateString = date === true ? `, ${cleanDate(ms)}` : '';

    return `${utcString}${timeString}${dateString}`;
}

export function interactionLogContext(interaction: Interaction) {
    return `Interaction ${interaction.id} Type ${interaction.type} User ${interaction.user.id}`;
}

export function setPresence() {
    let presence = container.customPresence;

    if (presence === null) {
        presence = structuredClone(Options.presence);
    }

    container.client.user?.setPresence(presence!);
}

export const slashCommandResolver = (interaction: CommandInteraction) => {
    const commandOptions: (string | number | boolean)[] = [`/${interaction.commandName}`];

    interaction.options.data.forEach((value) => {
        let option = value;

        if (typeof option.value !== 'undefined') {
            commandOptions.push(`${option.name}: ${option.value}`);
        }

        if (option.type === 'SUB_COMMAND_GROUP') {
            commandOptions.push(option.name);
            option = option.options![0]!;
        }

        if (option.type === 'SUB_COMMAND') {
            commandOptions.push(value.name);
        }

        if (Array.isArray(option.options)) {
            value.options?.forEach((subOption) => {
                commandOptions.push(`${subOption.name}: ${subOption.value}`);
            });
        }
    });

    return commandOptions.join(' ');
};

export function timestamp(ms: unknown, style?: typeof Formatters.TimestampStylesString) {
    if (!isNumber(ms) || ms < 0) {
        return null;
    }

    return Formatters.time(Math.round(ms / 1000), style ?? 'f');
}

function isDate(value: unknown): value is Date {
    return Object.prototype.toString.call(value) === '[object Date]';
}

function isNumber(value: unknown): value is number {
    return typeof value === 'number';
}
