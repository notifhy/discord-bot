import type {
    ClientEvent,
    CommandExecute,
    CommandProperties,
    ClientCommand,
} from '../@types/client';
import type { ClientModule } from '../@types/modules';
import { BetterEmbed } from '../util/utility';
import { CommandInteraction } from 'discord.js';
import Constants from '../util/Constants';

export const properties: CommandProperties = {
    name: 'reload',
    description: 'Reloads all imports or a single import',
    usage: '/reload [all/single] <type>',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    structure: {
        name: 'reload',
        description: 'Reload',
        options: [
            {
                name: 'all',
                type: 1,
                description: 'Refreshes all imports',
            },
            {
                name: 'single',
                type: 1,
                description: 'Refresh a single command',
                options: [
                    {
                        name: 'type',
                        type: 3,
                        description: 'The category to refresh',
                        required: true,
                        choices: [
                            {
                                name: 'commands',
                                value: 'commands',
                            },
                            {
                                name: 'events',
                                value: 'events',
                            },
                            {
                                name: 'modules',
                                value: 'modules',
                            },
                        ],
                    },
                    {
                        name: 'item',
                        type: 3,
                        description: 'The item to refresh',
                        required: true,
                    },
                ],
            },
        ],
    },
};

export const execute: CommandExecute = async (
    interaction: CommandInteraction,
): Promise<void> => {
    switch (interaction.options.getSubcommand()) {
        case 'all': {
            const now = Date.now();
            const promises: Promise<void>[] = [];

            for (const [command] of interaction.client.commands) {
                promises.push(commandRefresh(interaction, command));
            }

            for (const [event] of interaction.client.events) {
                promises.push(eventRefresh(interaction, event));
            }

            for (const [module] of interaction.client.modules) {
                promises.push(moduleRefresh(interaction, module));
            }

            await Promise.all(promises);

            const reloadedEmbed = new BetterEmbed({
                color: Constants.colors.normal,
                footer: interaction,
            })
                .setTitle(`Reloaded Everything`)
                .setDescription(
                    `All imports have been reloaded! This action took ${
                        Date.now() - now
                    } milliseconds.`,
                );

            await interaction.editReply({ embeds: [reloadedEmbed] });
            break;
        }
        case 'single': {
            const now = Date.now();
            const typeName = interaction.options.getString('type');
            const type =
                interaction.client[
                    typeName as keyof Pick<
                        typeof interaction.client,
                        'commands' | 'events' | 'modules'
                    >
                ];
            const item = interaction.options.getString('item')!;
            const selected = type.get(item);

            if (selected === undefined) {
                const undefinedSelected = new BetterEmbed({
                    color: Constants.colors.warning,
                    footer: interaction,
                })
                    .setTitle('Unknown Item')
                    .setDescription(
                        `There is no item with the structure ${typeName}.${item}!`,
                    );

                await interaction.editReply({ embeds: [undefinedSelected] });
                return;
            }

            if (typeName === 'commands') {
                commandRefresh(interaction, selected.properties.name);
            } else if (typeName === 'events') {
                eventRefresh(interaction, selected.properties.name);
            } else if (typeName === 'modules') {
                moduleRefresh(interaction, selected.properties.name);
            }

            const reloadedEmbed = new BetterEmbed({
                color: Constants.colors.normal,
                footer: interaction,
            })
                .setTitle(`Reloaded`)
                .setDescription(
                    `${typeName}.${item} was successfully reloaded! This action took ${
                        Date.now() - now
                    } milliseconds.`,
                );

            await interaction.editReply({ embeds: [reloadedEmbed] });
            break;
        }

        //no default
    }
};


async function commandRefresh(interaction: CommandInteraction, item: string) {
    const refreshed = await reload<ClientCommand>(`${item}.ts`);
    interaction.client.commands.set(refreshed.properties.name, refreshed);
}

async function eventRefresh(interaction: CommandInteraction, item: string) {
    const refreshed = await reload<ClientEvent>(`../events/${item}.ts`);
    interaction.client.events.set(refreshed.properties.name, refreshed);
}

async function moduleRefresh(interaction: CommandInteraction, item: string) {
    const refreshed = await reload<ClientModule>(`../modules/${item}.ts`);
    interaction.client.modules.set(refreshed.properties.name, refreshed);
}

function reload<Type>(path: string) {
    return new Promise<Type>(resolve => {
        delete require.cache[require.resolve(`${__dirname}/${path}`)];
        const refreshed: Type = require(`${__dirname}/${path}`); //eslint-disable-line @typescript-eslint/no-var-requires
        resolve(refreshed);
    });
}