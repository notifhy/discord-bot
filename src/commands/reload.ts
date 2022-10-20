import {
    type ApplicationCommandRegistry,
    BucketScope,
    Command,
    type Listener,
    Command as SapphireCommand,
} from '@sapphire/framework';
import { type CommandInteraction, Constants } from 'discord.js';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Options } from '../utility/Options';
import { interactionLogContext } from '../utility/utility';

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
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    description: 'Refreshes all imports',
                },
                {
                    name: 'single',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    description: 'Refresh a single item',
                    options: [
                        {
                            name: 'type',
                            type: Constants.ApplicationCommandOptionTypes.STRING,
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
                            ],
                        },
                        {
                            name: 'item',
                            type: Constants.ApplicationCommandOptionTypes.STRING,
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

    public override async chatInputRun(interaction: CommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case 'all':
                await this.all(interaction);
                break;
            case 'single':
                await this.single(interaction);
                break;
            // no default
        }
    }

    private async all(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const now = Date.now();
        const promises: Promise<void>[] = [];

        // eslint-disable-next-line no-restricted-syntax
        for (const [, command] of this.container.stores.get('commands')) {
            promises.push(this.reloadItem(command));
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const [, listener] of this.container.stores.get('listeners')) {
            promises.push(this.reloadItem(listener));
        }

        await Promise.all(promises);

        const reloadedEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsReloadAllTitle'))
            .setDescription(
                i18n.getMessage('commandsReloadAllDescription', [
                    promises.length,
                    Date.now() - now,
                ]),
            );

        const timeTaken = Date.now() - now;

        this.container.logger.info(
            interactionLogContext(interaction),
            `${this.constructor.name}:`,
            `All imports have been reloaded after ${timeTaken} milliseconds.`,
        );

        await interaction.editReply({ embeds: [reloadedEmbed] });
    }

    private async single(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const now = Date.now();
        const typeName = interaction.options.getString('type', true);
        const type = this.container.stores.get(typeName as 'commands' | 'listeners');

        const item = interaction.options.getString('item')!;
        const selected = type.get(item);

        if (typeof selected === 'undefined') {
            const undefinedSelected = new BetterEmbed(interaction)
                .setColor(Options.colorsWarning)
                .setTitle(i18n.getMessage('commandsReloadSingleUnknownTitle'))
                .setDescription(
                    i18n.getMessage('commandsReloadSingleUnknownDescription', [typeName, item]),
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
            interactionLogContext(interaction),
            `${this.constructor.name}:`,
            `${typeName}.${item} was successfully reloaded after ${timeTaken} milliseconds.`,
        );

        await interaction.editReply({
            embeds: [reloadedEmbed],
        });
    }

    private async reloadItem(item: SapphireCommand | Listener) {
        await item.reload();
    }
}
