import type { ClientCommand } from '../@types/client';
import { BetterEmbed } from '../../util/utility';
import { Constants } from '../util/Constants';
import { GlobalConstants } from '../../util/Constants';
import { RegionLocales } from '../locales/RegionLocales';

export const properties: ClientCommand['properties'] = {
    name: 'help',
    description: 'Displays helpful information and available commands.',
    cooldown: 5_000,
    ephemeral: true,
    noDM: false,
    ownerOnly: false,
    requireRegistration: false,
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
                        description: 'A command to get info about. This parameter is completely optional',
                        required: false,
                        choices: [
                            {
                                name: '/channel',
                                value: 'channel',
                            },
                            {
                                name: '/data',
                                value: 'data',
                            },
                            {
                                name: '/help',
                                value: 'help',
                            },
                            {
                                name: '/language',
                                value: 'language',
                            },
                            {
                                name: '/modules',
                                value: 'modules',
                            },
                            {
                                name: '/player',
                                value: 'player',
                            },
                            {
                                name: '/register',
                                value: 'register',
                            },
                        ],
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
            .addFields(
                {
                    name: text.information.introduction.name,
                    value: text.information.introduction.value,
                },
                {
                    name: text.information.modules.name,
                    value: text.information.modules.value,
                },
                {
                    name: text.information.setup.name,
                    value: text.information.setup.value,
                },
                {
                    name: text.information.other.name,
                    value: text.information.other.value,
                },
                {
                    name: text.information.gitHub.name,
                    value: text.information.gitHub.value,
                },
                {
                    name: text.information.legal.name,
                    value: text.information.legal.value,
                },
                {
                    name: text.information.contact.name,
                    value: text.information.contact.value,
                },
            );

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
                .setDescription(replace(text.specific.invalid.description, {
                    command: commandArg,
                }));

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

        commandSearchEmbed.addFields({
            name: text.specific.cooldown.name,
            value: replace(text.specific.cooldown.value, {
                commandCooldown:
                    command.properties.cooldown /
                    GlobalConstants.ms.second,
            }),
        });

        if (command.properties.noDM === true) {
            commandSearchEmbed.addFields({
                name: text.specific.dm.name,
                value: replace(text.specific.dm.value),
            });
        }

        if (command.properties.ownerOnly === true) {
            commandSearchEmbed.addFields({
                name: text.specific.owner.name,
                value: replace(text.specific.owner.value),
            });
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
            allCommandsEmbed.addFields({
                name: replace(text.all.field.name, {
                    commandName: command.properties.name,
                }),
                value: replace(text.all.field.value, {
                    commandDescription: command.properties.description,
                }),
            });
        }

        await interaction.editReply({ embeds: [allCommandsEmbed] });
    }
};