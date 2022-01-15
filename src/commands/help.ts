import type { ClientCommand } from '../@types/client';
import { BetterEmbed } from '../util/utility';
import { RegionLocales } from '../../locales/RegionLocales';
import Constants from '../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'help',
    description: 'Displays helpful information and available commands',
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
                type: 1,
                description: 'Displays information about commands',
                options: [
                    {
                        name: 'command',
                        type: 3,
                        description:
                            'A command to get info about. This parameter is completely optional',
                        required: false,
                    },
                ],
            },
            {
                name: 'information',
                description: 'Returns information about this bot ',
                type: 1,
            },
        ],
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const replace = RegionLocales.replace;
    const text = RegionLocales.locale(locale).commands.help;

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
            .setTitle(text.information.title)
            .setDescription(text.information.description);

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
                .setTitle(text.specific.invalid.title)
                .setDescription(
                    replace(text.specific.invalid.description, {
                        command: commandArg,
                    }),
                );
            await interaction.editReply({ embeds: [commandSearchEmbed] });
            return;
        }

        commandSearchEmbed.setTitle(
            replace(text.specific.title, {
                command: commandArg,
            }),
        );

        if (command.properties.description) {
            commandSearchEmbed.setDescription(
                replace(text.specific.description, {
                    commandDescription: command.properties.description,
                }),
            );
        }

        commandSearchEmbed.addField(
            text.specific.cooldown.name,
            replace(text.specific.cooldown.value, {
                commandCooldown: command.properties.cooldown / Constants.ms.second,
            }),
        );

        if (command.properties.noDM === true) {
            commandSearchEmbed.addField(
                text.specific.dm.name,
                replace(text.specific.dm.value),
            );
        }

        if (command.properties.ownerOnly === true) {
            commandSearchEmbed.addField(
                text.specific.owner.name,
                replace(text.specific.owner.value),
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
            .setTitle(text.all.title);

        for (const command of commandsCollection.values()) {
            allCommandsEmbed.addField(
                replace(text.all.field.name, {
                    commandName: command.properties.name,
                }),
                replace(text.all.field.value, {
                    commandDescription: command.properties.description,
                }),
            );
        }

        await interaction.editReply({ embeds: [allCommandsEmbed] });
    }
};