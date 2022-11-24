import type { config as Config } from '@prisma/client';
import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import { type CommandInteraction, Constants } from 'discord.js';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Options } from '../utility/Options';
import { interactionLogContext } from '../utility/utility';

export class ConfigCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'config',
            description: 'Configure and change settings',
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
                    name: 'core',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    description: 'Toggle the core',
                },
                {
                    name: 'corecron',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    description: 'Set the cron for the core',
                    options: [
                        {
                            name: 'cron',
                            type: Constants.ApplicationCommandOptionTypes.STRING,
                            description: 'The string of the cron',
                            required: true,
                        },
                    ],
                },
                {
                    name: 'devmode',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    description: 'Toggle Developer Mode',
                },
                {
                    name: 'loglevel',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    description: 'Set the minimum severity for logs to appear',
                    options: [
                        {
                            name: 'level',
                            type: Constants.ApplicationCommandOptionTypes.INTEGER,
                            description: 'The minimum level for logs to appear',
                            required: true,
                            choices: [
                                {
                                    name: 'Trace',
                                    value: 10,
                                },
                                {
                                    name: 'Debug',
                                    value: 20,
                                },
                                {
                                    name: 'Info',
                                    value: 30,
                                },
                                {
                                    name: 'Warn',
                                    value: 40,
                                },
                                {
                                    name: 'Error',
                                    value: 50,
                                },
                                {
                                    name: 'Fatal',
                                    value: 60,
                                },
                                {
                                    name: 'None',
                                    value: 100,
                                },
                            ],
                        },
                    ],
                },
                {
                    name: 'hypixelrequestbucket',
                    description: 'Set how many requests should be made per minute',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    options: [
                        {
                            name: 'amount',
                            type: Constants.ApplicationCommandOptionTypes.INTEGER,
                            description: 'The amount of requests to make per minute',
                            required: true,
                            minValue: 1,
                            maxValue: 240,
                        },
                    ],
                },
                {
                    name: 'ownerguilds',
                    description: 'Set the guild(s) where owner commands should be set',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    options: [
                        {
                            name: 'guilds',
                            type: Constants.ApplicationCommandOptionTypes.STRING,
                            description: 'The Ids of the guilds separated by a comma (no spaces)',
                            required: true,
                        },
                    ],
                },
                {
                    name: 'owners',
                    description: 'Set the application owner(s)',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    options: [
                        {
                            name: 'owners',
                            type: Constants.ApplicationCommandOptionTypes.STRING,
                            description: 'The Ids of the owners separated by a comma (no spaces)',
                            required: true,
                        },
                    ],
                },
                {
                    name: 'requesttimeout',
                    description: 'Set the request timeout before an abort error is thrown',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    options: [
                        {
                            name: 'milliseconds',
                            type: Constants.ApplicationCommandOptionTypes.INTEGER,
                            description: 'The timeout in milliseconds',
                            required: true,
                            minValue: 0,
                            maxValue: 100000,
                        },
                    ],
                },
                {
                    name: 'requestretrylimit',
                    description: 'Set the number of request retries before throwing',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    options: [
                        {
                            name: 'limit',
                            type: Constants.ApplicationCommandOptionTypes.INTEGER,
                            description: 'The number of retries',
                            required: true,
                            minValue: 0,
                            maxValue: 100,
                        },
                    ],
                },
                {
                    name: 'view',
                    description: 'View the current configuration',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                },
            ],
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: CommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case 'core':
                await this.core(interaction);
                break;
            case 'corecron':
                await this.coreCron(interaction);
                break;
            case 'devmode':
                await this.devMode(interaction);
                break;
            case 'loglevel':
                await this.logLevel(interaction);
                break;
            case 'hypixelrequestbucket':
                await this.hypixelRequestBucket(interaction);
                break;
            case 'ownerguilds':
                await this.ownerGuilds(interaction);
                break;
            case 'owners':
                await this.owners(interaction);
                break;
            case 'requesttimeout':
                await this.requestTimeout(interaction);
                break;
            case 'requestretrylimit':
                await this.requestRetryLimit(interaction);
                break;
            case 'view':
                await this.view(interaction);
                break;
            default:
                throw new RangeError();
        }
    }

    private async core(interaction: CommandInteraction) {
        const { i18n } = interaction;

        await this.handleConfigUpdate(
            interaction,
            'core',
            this.container.config.core === false,
            i18n.getMessage('commandsConfigCoreTitle'),
            i18n.getMessage('commandsConfigCoreDescription', [
                this.container.config.core === false ? i18n.getMessage('on') : i18n.getMessage('off'),
            ]),
        );

        this.container.core[this.container.config.core ? 'cronStart' : 'cronStop']();
    }

    private async coreCron(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const cron = interaction.options.getString('cron', true);

        await this.handleConfigUpdate(
            interaction,
            'coreCron',
            cron,
            i18n.getMessage('commandsConfigCoreCronTitle'),
            i18n.getMessage('commandsConfigCoreCronDescription', [
                cron,
            ]),
        );
    }

    private async devMode(interaction: CommandInteraction) {
        const { i18n } = interaction;

        await this.handleConfigUpdate(
            interaction,
            'devMode',
            this.container.config.devMode === false,
            i18n.getMessage('commandsConfigDevModeTitle'),
            i18n.getMessage('commandsConfigDevModeDescription', [
                this.container.config.devMode === false ? i18n.getMessage('on') : i18n.getMessage('off'),
            ]),
        );
    }

    private async logLevel(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const level = interaction.options.getInteger('level', true);

        await this.handleConfigUpdate(
            interaction,
            'logLevel',
            level,
            i18n.getMessage('commandsConfigLogLevelTitle'),
            i18n.getMessage('commandsConfigLogLevelDescription', [level]),
        );

        // @ts-ignore
        this.container.logger.level = this.container.config.logLevel;
    }

    private async hypixelRequestBucket(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const amount = interaction.options.getInteger('amount', true);

        await this.handleConfigUpdate(
            interaction,
            'hypixelRequestBucket',
            amount,
            i18n.getMessage('commandsConfigHypixelRequestBucketTitle'),
            i18n.getMessage('commandsConfigHypixelRequestBucketDescription', [amount]),
        );

        this.container.hypixel.updateBucket();
    }

    private async ownerGuilds(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const guilds = interaction.options.getString('guilds', true).split(',');

        await this.handleConfigUpdate(
            interaction,
            'ownerGuilds',
            guilds,
            i18n.getMessage('commandsConfigOwnerGuildsTitle'),
            i18n.getMessage('commandsConfigOwnerGuildsDescription', [guilds.join(', ')]),
        );
    }

    private async owners(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const owners = interaction.options.getString('owners', true).split(',');

        await this.handleConfigUpdate(
            interaction,
            'owners',
            owners,
            i18n.getMessage('commandsConfigOwnersTitle'),
            i18n.getMessage('commandsConfigOwnersDescription', [owners.join(', ')]),
        );
    }

    private async requestTimeout(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const milliseconds = interaction.options.getInteger('milliseconds', true);

        await this.handleConfigUpdate(
            interaction,
            'requestTimeout',
            milliseconds,
            i18n.getMessage('commandsConfigRequestTimeoutTitle'),
            i18n.getMessage('commandsConfigRequestTimeoutDescription', [milliseconds]),
        );
    }

    private async requestRetryLimit(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const limit = interaction.options.getInteger('limit', true);

        await this.handleConfigUpdate(
            interaction,
            'requestRetryLimit',
            limit,
            i18n.getMessage('commandsConfigRequestRetryLimitTitle'),
            i18n.getMessage('commandsConfigRequestRetryLimitDescription', [limit]),
        );
    }

    private async view(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const { config } = this.container;

        const viewEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsConfigViewTitle'))
            .setDescription(
                i18n.getMessage('commandsConfigViewDescription', [
                    config.core ? i18n.getMessage('on') : i18n.getMessage('off'),
                    config.coreCron,
                    config.devMode ? i18n.getMessage('on') : i18n.getMessage('off'),
                    config.hypixelRequestBucket,
                    config.logLevel,
                    config.ownerGuilds.join(', '),
                    config.owners.join(', '),
                    config.requestTimeout,
                    config.requestRetryLimit,
                ]),
            );

        await interaction.editReply({ embeds: [viewEmbed] });
    }

    private async handleConfigUpdate(
        interaction: CommandInteraction,
        key: keyof Config,
        value: typeof this.container.config[typeof key],
        title: string,
        description: string,
    ) {
        // @ts-ignore
        this.container.config[key] = value;

        await this.container.database.config.update({
            data: {
                [key]: this.container.config[key],
            },
            where: {
                index: 0,
            },
        });

        const configEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(title)
            .setDescription(description);

        await interaction.editReply({ embeds: [configEmbed] });

        this.container.logger.info(
            interactionLogContext(interaction),
            `${this.constructor.name}:`,
            `${key} is now ${this.container.config[key]}.`,
        );
    }
}
