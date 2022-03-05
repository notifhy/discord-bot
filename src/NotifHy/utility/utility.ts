import type { UserAPIData } from '../@types/database';
import {
    AwaitMessageCollectorOptionsParams,
    Client,
    CommandInteraction,
    MessageActionRow,
    MessageComponentType,
    TextBasedChannel,
} from 'discord.js';
import { Constants } from './Constants';
import { SQLite } from './SQLite';

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
            (error as Error & { code: string })
                ?.code === 'INTERACTION_COLLECTOR_ERROR'
        ) {
            return null;
        }

        throw error;
    }
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

export function setPresence(client: Client) {
    const users = SQLite.getAllUsers<UserAPIData>({
        table: Constants.tables.api,
        columns: ['discordID'],
    });

    let presence = client.customPresence;

    if (presence === null) {
        //@ts-expect-error typings not available yet for structuredClone
        presence = structuredClone(Constants.defaults.presence);

        presence!.activities?.forEach(activity => {
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