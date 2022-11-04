import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import {
    type CommandInteraction,
    Constants,
} from 'discord.js';
import { Options } from '../utility/Options';

export class ModuleCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'module',
            description: 'Enable, disable, and configure modules',
            cooldownLimit: 3,
            cooldownDelay: 60_000,
            cooldownScope: BucketScope.User,
            preconditions: ['Base', 'DevMode', 'Registration'],
            requiredUserPermissions: [],
            requiredClientPermissions: [],
        });

        this.chatInputStructure = {
            name: this.name,
            description: this.description,
            options: [
                {
                    name: 'defender',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    description: 'Get notified on logins, logouts, version changes, and more',
                },
                {
                    name: 'friends',
                    description: 'Know when your friends are online by sharing logins and logouts with each other',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                },
                {
                    name: 'rewards',
                    description: 'Never miss a daily reward again - get notifications to claim your daily reward at your convenience',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                },
            ],
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(_interaction: CommandInteraction) {
        // wip
    }
}
