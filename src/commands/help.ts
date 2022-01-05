import type {
    CommandExecute,
    CommandProperties,
    ClientCommand,
} from '../@types/client';
import { BetterEmbed } from '../util/utility';
import { CommandInteraction } from 'discord.js';
import { RegionLocales } from '../../locales/localesHandler';
import Constants from '../util/errors/Constants';

export const properties: CommandProperties = {
    name: 'help',
    description: 'Displays helpful information and available commands',
    usage: '/help [commands/information] <command>',
    cooldown: 5_000,
    ephemeral: true,
    noDM: false,
    ownerOnly: false,
    structure: {
        name: 'help',
        description: 'Displays helpful information and available commands',
        options: [
            {
                name: 'commands',
                type: '1',
                description: 'Displays information about commands',
                options: [
                    {
                        name: 'command',
                        type: '3',
                        description:
                            'A command to get info about. This parameter is completely optional',
                        required: false,
                    },
                ],
            },
            {
                name: 'information',
                description: 'Returns information about this bot ',
                type: '1',
            },
        ],
    },
};

export const execute: CommandExecute = async (
    interaction: CommandInteraction,
    { userData },
): Promise<void> => {
    const replace = RegionLocales.replace;
    const locale = RegionLocales.locale(userData.language).commands.help;

    if (interaction.options.getSubcommand() === 'information') {
        await information();
    } else if (interaction.options.getString('command')) {
        await specific();
    } else {
        await commands();
    }

    async function information() {
        const informationEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(locale.information.title)
            .setDescription(locale.information.description);

        await interaction.editReply({ embeds: [informationEmbed] });
    }

    async function specific() {
        const commandArg =
            interaction.options.getString('command', true);
        const command: ClientCommand | undefined =
            interaction.client.commands.get(commandArg);
        const commandSearchEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal);

        if (command === undefined) {
            commandSearchEmbed
                .setColor(Constants.colors.warning)
                .setTitle(locale.specific.invalid.title)
                .setDescription(
                    replace(locale.specific.invalid.description, {
                        command: commandArg,
                    }),
                );
            await interaction.editReply({ embeds: [commandSearchEmbed] });
            return;
        }

        commandSearchEmbed.setTitle(
            replace(locale.specific.title, {
                command: commandArg,
            }),
        );

        if (command.properties.description) {
            commandSearchEmbed.setDescription(
                replace(locale.specific.description, {
                    commandDescription: command.properties.description,
                }),
            );
        }

        commandSearchEmbed.addField(
            locale.specific.usage.name,
            replace(locale.specific.usage.value, {
                commandUsage: command.properties.usage,
            }),
        );

        commandSearchEmbed.addField(
            locale.specific.cooldown.name,
            replace(locale.specific.cooldown.value, {
                commandCooldown: command.properties.cooldown / Constants.ms.second,
            }),
        );

        if (command.properties.noDM === true) {
            commandSearchEmbed.addField(
                locale.specific.dm.name,
                replace(locale.specific.dm.value),
            );
        }

        if (command.properties.ownerOnly === true) {
            commandSearchEmbed.addField(
                locale.specific.owner.name,
                replace(locale.specific.owner.value),
            );
        }

        await interaction.editReply({ embeds: [commandSearchEmbed] });
    }

    async function commands() {
        const commandsCollection = interaction.client.commands.filter(
            command => command.properties.ownerOnly === false,
        );
        const allCommandsEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(locale.all.title)
            .setDescription(locale.all.description);

        for (const command of commandsCollection.values()) {
            allCommandsEmbed.addField(
                replace(locale.all.field.name, {
                    commandUsage: command.properties.usage,
                }),
                replace(locale.all.field.value, {
                    commandDescription: command.properties.description,
                }),
            );
        }

        await interaction.editReply({ embeds: [allCommandsEmbed] });
    }
};