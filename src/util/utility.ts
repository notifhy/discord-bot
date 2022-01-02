import type { WebhookConfig } from '../@types/client';
import {
    AwaitMessageCollectorOptionsParams,
    CommandInteraction,
    MessageActionRow,
    MessageComponentType,
    MessageEmbed,
    PermissionResolvable,
    Permissions,
    PermissionString,
    TextBasedChannel,
    WebhookClient,
} from 'discord.js';
import Constants from './Constants';
import BaseErrorHandler from './errors/handlers/BaseErrorHandler';

export async function awaitComponent(
    channel: TextBasedChannel,
    component: MessageComponentType,
    options: Omit<AwaitMessageCollectorOptionsParams<typeof component, true>, 'componentType'>,
) {
    try {
        return await channel.awaitMessageComponent({
            componentType: component,
            ...options,
        });
    } catch (error) {
        if (
            error instanceof Error &&
            (error as Error &{ code: string })
                ?.code === 'INTERACTION_COLLECTOR_ERROR'
        ) {
            return null;
        }

        throw error;
    }
}

type Footer =
    | {
          name: string;
          imageURL?: string;
      }
    | CommandInteraction;

export class BetterEmbed extends MessageEmbed {
    constructor(footer?: Footer) {
        super();
        super.setTimestamp();

        if (footer instanceof CommandInteraction) {
            const interaction = footer;
            const avatar = interaction.user.displayAvatarURL({ dynamic: true });
            super.setFooter({ text: `/${interaction.commandName}`, iconURL: avatar });
        } else if (footer !== undefined) {
            super.setFooter({ text: footer.name, iconURL: footer.imageURL });
        }
    }

    setField(name: string, value: string, inline?: boolean | undefined): this {
        super.setFields([{ name: name, value: value, inline: inline }]);

        return this;
    }

    unshiftField(
        name: string,
        value: string,
        inline?: boolean | undefined,
    ): this {
        super.setFields(
            { name: name, value: value, inline: inline },
            ...this.fields,
        );

        return this;
    }
}

//Modified from https://stackoverflow.com/a/4149671
export function camelToNormal(input: string) {
    return input
        .split(/(?=[A-Z])/)
        .map(section => section.charAt(0).toUpperCase() + section.slice(1))
        .join(' ');
}

export function cleanDate(ms: number | Date): string | null {
    const newDate = new Date(ms);
    if (
        !ms ||
        ms < 0 ||
        Object.prototype.toString.call(newDate) !== '[object Date]'
    ) {
        return null;
    }

    const day = newDate.getDate(),
        month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(
            newDate,
        ),
        year = newDate.getFullYear();
    return `${month} ${day}, ${year}`;
}

export function cleanLength(
    ms: number | null,
    rejectZero?: boolean,
): string | null {
    if (ms === null || isNaN(ms)) {
        return null;
    }

    let newMS = Math.floor(ms / Constants.ms.second) * Constants.ms.second;

    if (rejectZero ? newMS <= 0 : newMS < 0) {
        return null;
    }

    const days = Math.floor(newMS / Constants.ms.day);
    newMS -= days * Constants.ms.day;
    const hours = Math.floor(newMS / Constants.ms.hour);
    newMS -= hours * Constants.ms.hour;
    const minutes = Math.floor(newMS / Constants.ms.minute);
    newMS -= minutes * Constants.ms.minute;
    const seconds = Math.floor(newMS / Constants.ms.second);
    return days > 0
        ? `${days}d ${hours}h ${minutes}m ${seconds}s`
        : hours > 0
        ? `${hours}h ${minutes}m ${seconds}s`
        : minutes > 0
        ? `${minutes}m ${seconds}s`
        : `${seconds}s`;
}

export function cleanRound(number: number, decimals?: number) {
    const decimalsFactor = 10 ** (decimals ?? 2);
    return Math.round(number * decimalsFactor) / decimalsFactor;
}

export function compare<Primary, Secondary extends Primary>(
    primary: Primary,
    secondary: Secondary,
) {
    const primaryDifferences = {} as Partial<Primary>;
    const secondaryDifferences = {} as Partial<Secondary>;
    for (const key in primary) {
        //@ts-expect-error hasOwn typing not implemented yet
        if (Object.hasOwn(primary, key) === true) {
            if (primary[key] !== secondary[key]) {
                primaryDifferences[key] = primary[key];
                secondaryDifferences[key] = secondary[key];
            }
        }
    }

    return { primary: primaryDifferences, secondary: secondaryDifferences };
}

//Taken from https://stackoverflow.com/a/13016136 under CC BY-SA 3.0 matching ISO 8601
export function createOffset(date = new Date()): string {
    function pad(value: number) {
        return value < 10 ? `0${value}` : value;
    }

    const sign = date.getTimezoneOffset() > 0 ? '-' : '+',
        offset = Math.abs(date.getTimezoneOffset()),
        hours = pad(Math.floor(offset / 60)),
        minutes = pad(offset % 60);
    return `${sign + hours}:${minutes}`;
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
    if (
        !ms ||
        ms < 0 ||
        Object.prototype.toString.call(newDate) !== '[object Date]'
    ) {
        return null;
    }

    return `${
        utc === true ? `UTC${createOffset()} ` : ''
    }${newDate.toLocaleTimeString('en-IN', { hour12: true })}${
        date === true ? `, ${cleanDate(ms)}` : ''
    }`;
}

export function disableComponents(messageActionRows: MessageActionRow[]) {
    const actionRows = messageActionRows
        .map(row => new MessageActionRow(row));

    for (const actionRow of actionRows) {
        const components = actionRow.components;

        for (const component of components) {
            component.disabled = true;
        }
    }

    return actionRows;
}

export function matchPermissions(
    required: PermissionResolvable,
    subject: Permissions,
): PermissionString[] {
    const missing = subject.missing(required);
    return missing;
}

type AcceptedValues = string | boolean | number;

type GenericObject = {
    [index: string]: GenericObject | AcceptedValues[] | AcceptedValues;
};

type Modifier = (value: AcceptedValues) => unknown; //eslint-disable-line no-unused-vars

export function nestedIterate(
    inParam: GenericObject,
    modify: Modifier,
): unknown {
    //@ts-expect-error typings not available yet for structuredClone
    const modified = structuredClone(inParam);
    recursive(modified);

    function recursive(input: GenericObject) {
        for (const index in input) {
            //@ts-expect-error hasOwn typing not implemented yet
            if (Object.hasOwn(input, index)) {
                if (
                    typeof input[index] === 'object' ||
                    Array.isArray(input[index])
                ) {
                    recursive(input[index] as GenericObject);
                } else if (
                    typeof input[index] === 'string' ||
                    typeof input[index] === 'boolean' ||
                    typeof input[index] === 'number' ||
                    typeof input[index] === 'bigint'
                ) {
                    input[index] = (
                        modify(
                            input[index] as AcceptedValues,
                        ) as typeof input[typeof index]
                    ) ?? input[index];
                }
            }
        }
    }

    return modified;
}

export async function sendWebHook({
    content,
    embeds,
    webhook,
    suppressError = true,
}: {
    content?: string | null;
    embeds: MessageEmbed[];
    webhook: WebhookConfig;
    suppressError?: boolean;
}): Promise<void> {
    try {
        await new WebhookClient({ id: webhook.id, token: webhook.token }).send({
            content: content,
            embeds: embeds,
        });
    } catch (err) {
        BaseErrorHandler.staticLog(`An error has occurred while sending an WebHook | ${
            (err as Error)?.stack ?? (err as Error)?.message
        }`);

        if (suppressError === true) {
            return;
        }

        throw err;
    }
}

export const slashCommandResolver = (interaction: CommandInteraction) => {
    const commandOptions: (string | number | boolean)[] = [
        `/${interaction.commandName}`,
    ];

    for (let option of interaction.options.data) {
        if (option.value) {
            commandOptions.push(
                `${option.name}: ${option.value}`,
            );
        }

        if (option.type === 'SUB_COMMAND_GROUP') {
            commandOptions.push(option.name);
            [option] = option.options!;
        }

        if (option.type === 'SUB_COMMAND') {
            commandOptions.push(option.name);
        }

        if (Array.isArray(option.options)) {
            for (const subOption of option.options) {
                commandOptions.push(
                    `${subOption.name}: ${subOption.value}`,
                );
            }
        }
    }

    return commandOptions.join(' ');
};


export function timeAgo(ms: number): number | null {
    if (ms < 0 || ms === null || isNaN(ms)) {
        return null;
    }
    return Date.now() - ms;
}