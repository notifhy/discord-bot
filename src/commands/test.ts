import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import { type CommandInteraction, Constants } from 'discord.js';
import { Options } from '../utility/Options';
import { generateHash, generatePassword, generateSalt } from '../utility/utility';

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
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                    description: 'Delete all of your data',
                    options: [
                        {
                            name: 'view',
                            description: 'Returns a file with all of your data',
                            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                            options: [
                                {
                                    name: 'command',
                                    type: Constants.ApplicationCommandOptionTypes.STRING,
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

        const password = generatePassword(Options.authenticationPasswordLength);

        const salt = generateSalt(Options.authenticationSaltLength);

        const hash = generateHash(password, salt);

        this.container.logger.info(this, password);

        await this.container.database.authentication.update({
            data: {
                hash: hash,
                salt: salt,
            },
            where: {
                id: interaction.user.id,
            },
        });
    }
}
