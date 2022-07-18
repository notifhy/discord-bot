import {
    ActionRowBuilder,
    APIEmbedField,
    ApplicationCommandOptionType,
    AwaitMessageCollectorOptionsParams,
    ButtonBuilder,
    Client,
    CommandInteraction,
    EmbedBuilder,
    Formatters,
    MessageComponentType,
    normalizeArray,
    RestOrArray,
    SelectMenuBuilder,
    TextBasedChannel,
    WebhookClient,
    WebhookMessageOptions,
} from 'discord.js';
import { type WebhookConfig } from '../@types/client';
import { UserAPIData } from '../@types/database';
import { Constants } from './Constants';
import { SQLite } from './SQLite';

export function arrayRemove<Type extends unknown[]>(
    array: Type,
    ...items: unknown[]
): Type {
    return array.filter((item) => !(items.includes(item))) as Type;
}

export async function awaitComponent<T extends MessageComponentType>(
    channel: TextBasedChannel,
    options: AwaitMessageCollectorOptionsParams<T, true>,
) {
    try {
        return await channel.awaitMessageComponent<T>(options);
    } catch (error) {
        if (
            error instanceof Error
            && (error as Error & { code: string })
                ?.code === 'INTERACTION_COLLECTOR_ERROR'
        ) {
            return null;
        }

        throw error;
    }
}

type Footer =
    | {
        text: string,
        iconURL?: string,
    }
    | CommandInteraction;

export class BetterEmbed extends EmbedBuilder {
    public constructor(footer?: Footer) {
        super();
        this.setTimestamp();

        if (footer instanceof CommandInteraction) {
            const interaction = footer;
            const avatar = interaction.user.displayAvatarURL();
            this.setFooter({ text: `/${interaction.commandName}`, iconURL: avatar });
        } else if (footer !== undefined) {
            this.setFooter({ text: footer.text, iconURL: footer.iconURL });
        }
    }

    public setField(name: string, value: string, inline?: boolean | undefined): this {
        this.setFields({ name: name, value: value, inline: inline });

        return this;
    }

    public unshiftFields(...fields: RestOrArray<APIEmbedField>): this {
        this.data.fields ??= [];
        this.data.fields.unshift(...normalizeArray(fields));

        return this;
    }
}

export function capitolToNormal(item: string | null) {
    function containsLowerCase(string: string): boolean {
        let lowerCase = false;

        for (let i = 0; i < string.length; i += 1) {
            const character = string.charAt(i);
            if (character === character.toLowerCase()) {
                lowerCase = true;
                break;
            }
        }

        return lowerCase;
    }

    return typeof item === 'string'
        ? item
            .replaceAll('_', ' ')
            .toLowerCase()
            .split(' ')
            .map((value) => {
                if (containsLowerCase(value)) {
                    return value.charAt(0).toUpperCase() + value.slice(1);
                }

                return value;
            })
            .join(' ')
        : item;
}

export function cleanDate(ms: number | Date): string | null {
    const newDate = new Date(ms);
    if (
        ms < 0
        || !isDate(newDate)
    ) {
        return null;
    }

    const day = newDate.getDate();
    const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(
        newDate,
    );
    const year = newDate.getFullYear();
    return `${month} ${day}, ${year}`;
}

export function cleanGameMode(mode: string | null) {
    if (mode === null) {
        return null;
    }

    if (mode === 'LOBBY') {
        return 'Lobby';
    }

    const gameMode = Constants.clean.modes.find(
        ({ key }) => (Array.isArray(key) ? key.includes(mode) : key === mode),
    );

    return gameMode?.name ?? mode;
}

export function cleanGameType(type: string | null) {
    if (type === null) {
        return null;
    }

    const { gameTypes } = Constants.clean;

    const gameType = gameTypes[
        type as keyof typeof Constants.clean.gameTypes
    ];

    return gameType ?? type;
}

export function cleanLength(
    ms: number | null,
    rejectZero?: boolean,
): string | null {
    if (!isNumber(ms)) {
        return null;
    }

    let newMS = Math.floor(ms / Constants.ms.second)
        * Constants.ms.second;

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

export function compare<Primary, Secondary extends Primary>(
    primary: Primary,
    secondary: Secondary,
) {
    const primaryDifferences = {} as Partial<Primary>;
    const secondaryDifferences = {} as Partial<Secondary>;

    // eslint-disable-next-line no-restricted-syntax
    for (const key in primary) {
        // @ts-expect-error hasOwn typing not implemented yet
        if (Object.hasOwn(primary, key) === true) {
            if (primary[key] !== secondary[key]) {
                primaryDifferences[key] = primary[key];
                secondaryDifferences[key] = secondary[key];
            }
        }
    }

    return { primary: primaryDifferences, secondary: secondaryDifferences };
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

export function disableComponents(messageActionRows: ActionRowBuilder[]) {
    const actionRows = messageActionRows
        .map((row) => new ActionRowBuilder<SelectMenuBuilder | ButtonBuilder>(row));

    // eslint-disable-next-line no-restricted-syntax
    for (const actionRow of actionRows) {
        const { components } = actionRow;

        // eslint-disable-next-line no-restricted-syntax
        for (const component of components) {
            component.setDisabled();
        }
    }

    return actionRows;
}

export function formattedUnix({
    ms = Date.now(),
    date = false,
    utc = true,
}: {
    ms?: number | Date,
    date: boolean,
    utc: boolean,
}): string | null {
    const newDate = new Date(ms);
    if (
        ms < 0
        || !isDate(newDate)
    ) {
        return null;
    }

    return `${utc === true ? `UTC${createOffset()} ` : ''
    }${newDate.toLocaleTimeString('en-IN', { hour12: true })}${date === true ? `, ${cleanDate(ms)}` : ''
    }`;
}

export function generateStackTrace() {
    const stack = new Error().stack ?? '';
    const cleanStack = stack
        .split('\n')
        .splice(2)
        .join('\n');

    return cleanStack;
}

type AcceptedValues = string | boolean | number;

type GenericObject = {
    [index: string]: GenericObject | AcceptedValues[] | AcceptedValues;
};

type Modifier = (value: AcceptedValues) => unknown; // eslint-disable-line no-unused-vars

export function nestedIterate(
    inParam: GenericObject,
    modify: Modifier,
): unknown {
    const modified = structuredClone(inParam);
    recursive(modified);

    function recursive(input: GenericObject) {
        // eslint-disable-next-line no-restricted-syntax
        for (const index in input) {
            if (Object.hasOwn(input, index)) {
                if (
                    typeof input[index] === 'object'
                    || Array.isArray(input[index])
                ) {
                    recursive(input[index] as GenericObject);
                } else if (
                    typeof input[index] === 'string'
                    || typeof input[index] === 'boolean'
                    || typeof input[index] === 'number'
                    || typeof input[index] === 'bigint'
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

export async function sendWebHook(
    {
        webhook,
        suppressError,
        ...payload
    }: {
        webhook: WebhookConfig,
        suppressError?: boolean,
    } & WebhookMessageOptions,
): Promise<void> {
    try {
        await new WebhookClient({ id: webhook.id, token: webhook.token })
            .send(payload);
    } catch (err) {
        if (suppressError === false) {
            throw err;
        }
    }
}

export function setPresence(client: Client) {
    const users = SQLite.getAllUsers<UserAPIData>({
        table: Constants.tables.api,
        columns: ['discordID'],
    });

    let presence = client.customPresence;

    if (presence === null) {
        presence = structuredClone(Constants.defaults.presence);

        presence!.activities?.forEach((activity) => {
            activity.name = activity.name
                ?.replace('{{ accounts }}', String(users.length))
                ?.replace('{{ servers }}', String(client.guilds.cache.size));
        });
    }

    client.user?.setPresence(presence!);
}

export const slashCommandResolver = (interaction: CommandInteraction) => {
    const commandOptions: (string | number | boolean)[] = [
        `/${interaction.commandName}`,
    ];

    interaction.options.data.forEach((value) => {
        let option = value;

        if (typeof option.value !== 'undefined') {
            commandOptions.push(
                `${option.name}: ${option.value}`,
            );
        }

        if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
            commandOptions.push(option.name);
            [option] = option.options!;
        }

        if (option.type === ApplicationCommandOptionType.Subcommand) {
            commandOptions.push(value.name);
        }

        if (Array.isArray(option.options)) {
            value.options?.forEach((subOption) => {
                commandOptions.push(
                    `${subOption.name}: ${subOption.value}`,
                );
            });
        }
    });

    return commandOptions.join(' ');
};

export function timeAgo(ms: unknown): number | null {
    if (
        !isNumber(ms)
        || ms < 0
    ) {
        return null;
    }

    return Date.now() - ms;
}

export function timestamp(
    ms: unknown,
    style?: typeof Formatters.TimestampStylesString,
) {
    if (
        !isNumber(ms)
        || ms < 0
    ) {
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