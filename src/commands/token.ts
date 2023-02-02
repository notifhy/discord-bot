import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Logger } from '../structures/Logger';
import { Options } from '../utility/Options';
import { generateHash, generatePassword, generateSalt } from '../utility/utility';

export class RegisterCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'token',
            description: 'Generate an authentication token for use with the companion mod',
            cooldownLimit: 1,
            cooldownDelay: 60_000,
            cooldownScope: BucketScope.User,
            preconditions: ['Base', 'DevMode', 'Registration'],
            requiredUserPermissions: [],
            requiredClientPermissions: [],
        });

        this.chatInputStructure = {
            name: this.name,
            description: this.description,
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        const password = generatePassword(Options.authenticationPasswordLength);
        const salt = generateSalt(Options.authenticationSaltLength);
        const hash = generateHash(password, salt);

        await this.container.database.authentication.update({
            data: {
                hash: hash,
                salt: salt,
            },
            where: {
                id: interaction.user.id,
            },
        });

        const embed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsTokenTitle'))
            .setDescription(i18n.getMessage('commandsTokenDescription', [password]));

        this.container.logger.info(
            this,
            Logger.interactionLogContext(interaction),
            'Generated new token.',
        );

        await interaction.editReply({
            embeds: [embed],
        });
    }
}
