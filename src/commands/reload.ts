import {
    type ApplicationCommandRegistry,
    BucketScope,
    Command,
    type Piece,
} from '@sapphire/framework';
import { ApplicationCommandOptionType, type ChatInputCommandInteraction } from 'discord.js';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Logger } from '../structures/Logger';
import { Options } from '../utility/Options';

export class ReloadCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'reload',
            description: 'Reloads all imports or a single import',
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
                    name: 'all',
                    type: ApplicationCommandOptionType.Subcommand,
                    description: 'Refreshes all imports',
                },
                {
                    name: 'single',
                    type: ApplicationCommandOptionType.Subcommand,
                    description: 'Refresh a single item',
                    options: [
                        {
                            name: 'type',
                            type: ApplicationCommandOptionType.String,
                            description: 'The category to refresh',
                            required: true,
                            choices: [
                                {
                                    name: 'commands',
                                    value: 'commands',
                                },
                                {
                                    name: 'listeners',
                                    value: 'listeners',
                                },
                                {
                                    name: 'modules',
                                    value: 'modules',
                                },
                                {
                                    name: 'routes',
                                    value: 'routes',
                                },
                            ],
                        },
                        {
                            name: 'item',
                            type: ApplicationCommandOptionType.String,
                            description: 'The item to refresh',
                            required: true,
                        },
                    ],
                },
            ],
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case 'all':
                await this.all(interaction);
                break;
            case 'single':
                await this.single(interaction);
                break;
            default:
                throw new RangeError();
        }
    }

    private async all(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        const now = Date.now();
        const items: Piece[] = [];

        this.container.stores.get('commands').forEach((command) => {
            items.push((command));
        });

        this.container.stores.get('listeners').forEach((listener) => {
            items.push((listener));
        });

        this.container.stores.get('modules').forEach((module) => {
            items.push((module));
        });

        this.container.stores.get('routes').forEach((route) => {
            items.push((route));
        });

        await Promise.all(items.map((item) => this.reloadItem(item)));

        const reloadedEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsReloadAllTitle'))
            .setDescription(
                i18n.getMessage('commandsReloadAllDescription', [
                    items.length,
                    Date.now() - now,
                ]),
            );

        const timeTaken = Date.now() - now;

        this.container.logger.info(
            this,
            Logger.interactionLogContext(interaction),
            `All imports have been reloaded after ${timeTaken} milliseconds.`,
        );

        await interaction.editReply({ embeds: [reloadedEmbed] });
    }

    private async single(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        const now = Date.now();
        const typeName = interaction.options.getString('type', true);
        const type = this.container.stores.get(typeName as 'commands' | 'listeners' | 'modules' | 'routes');

        const item = interaction.options.getString('item')!;
        const selected = type.get(item);

        if (typeof selected === 'undefined') {
            const undefinedSelected = new BetterEmbed(interaction)
                .setColor(Options.colorsWarning)
                .setTitle(i18n.getMessage('commandsReloadSingleUnknownTitle'))
                .setDescription(
                    i18n.getMessage('commandsReloadSingleUnknownDescription', [typeName, item]),
                );

            this.container.logger.warn(
                this,
                Logger.interactionLogContext(interaction),
                `Unknown item: ${typeName}.${item}.`,
            );

            await interaction.editReply({ embeds: [undefinedSelected] });
            return;
        }

        this.reloadItem(selected);

        const reloadedEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsReloadSingleSuccessTitle'))
            .setDescription(
                i18n.getMessage('commandsReloadSingleSuccessDescription', [
                    typeName,
                    item,
                    Date.now() - now,
                ]),
            );

        const timeTaken = Date.now() - now;

        this.container.logger.info(
            this,
            Logger.interactionLogContext(interaction),
            `${typeName}.${item} was successfully reloaded after ${timeTaken} milliseconds.`,
        );

        await interaction.editReply({
            embeds: [reloadedEmbed],
        });
    }

    private async reloadItem(item: Piece) {
        await item.reload();
    }
}
