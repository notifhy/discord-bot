import {
    type ApplicationCommandRegistry,
    BucketScope,
    Command,
} from '@sapphire/framework';
import { type CommandInteraction } from 'discord.js';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Options } from '../utility/Options';

export class PerformanceCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'performance',
            description: 'View system performance',
            cooldownLimit: 0,
            cooldownDelay: 0,
            cooldownScope: BucketScope.User,
            preconditions: [
                'Base',
                'DevMode',
                'OwnerOnly',
            ],
            requiredUserPermissions: [],
            requiredClientPermissions: [],
        });

        this.chatInputStructure = {
            name: this.name,
            description: this.description,
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(
            this.chatInputStructure,
            Options.commandRegistry(this),
        );
    }

    public async chatInputRun(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const { latest } = this.container.core.performance;

        const fetch = latest?.get('fetch');
        const parse = latest?.get('parse');
        const check = latest?.get('check');
        const send = latest?.get('send');
        const total = latest?.get('total');

        const responseEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(
                i18n.getMessage(
                    'commandsPerformanceTitle',
                ),
            )
            .addFields({
                name: i18n.getMessage('commandsPerformanceLatestName'),
                value: i18n.getMessage(
                    'commandsPerformanceLatestValue', [
                        fetch,
                        parse,
                        check,
                        send,
                        total,
                    ].map(
                        (value) => value ?? i18n.getMessage('null'),
                    ),
                ),
            });

        await interaction.editReply({
            embeds: [responseEmbed],
        });
    }
}