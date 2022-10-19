import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { Options } from '../utility/Options';

export class TestCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'test',
            description: 'Does stuff',
            cooldownLimit: 0,
            cooldownDelay: 0,
            cooldownScope: BucketScope.User,
            preconditions: ['Base', 'DevMode', 'OwnerOnly'],
            requiredUserPermissions: [],
            requiredClientPermissions: [],
        });

        this.chatInputStructure = {
            name: this.name,
            description: this.description,
            options: [
                {
                    name: 'delete',
                    type: ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                    description: 'Delete all of your data',
                    options: [
                        {
                            name: 'view',
                            description: 'Returns a file with all of your data',
                            type: ApplicationCommandOptionTypes.SUB_COMMAND,
                            options: [
                                {
                                    name: 'command',
                                    type: ApplicationCommandOptionTypes.STRING,
                                    description:
                                        'A command to get info about. This parameter is completely optional',
                                    required: false,
                                },
                            ],
                        },
                    ],
                },
            ],
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: CommandInteraction) {
        await interaction.followUp({
            content: 'e',
        });

        throw new TypeError();
    }
}
