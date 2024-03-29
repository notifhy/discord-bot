import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import {
    ActivityType,
    ApplicationCommandOptionType,
    type ChatInputCommandInteraction,
    type PresenceStatusData,
} from 'discord.js';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Options } from '../utility/Options';
import { setPresence } from '../utility/utility';

export class PresenceCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'presence',
            description: 'Set a custom presence for the bot',
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
                    name: 'clear',
                    type: ApplicationCommandOptionType.Subcommand,
                    description: 'Clear the custom presence',
                },
                {
                    name: 'set',
                    description: 'Set a custom presence',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'status',
                            type: ApplicationCommandOptionType.String,
                            description: 'The status to use',
                            required: false,
                            choices: [
                                {
                                    name: 'Online',
                                    value: 'online',
                                },
                                {
                                    name: 'Idle',
                                    value: 'idle',
                                },
                                {
                                    name: 'Invisible',
                                    value: 'invisible',
                                },
                                {
                                    name: 'Do Not Disturb',
                                    value: 'dnd',
                                },
                            ],
                        },
                        {
                            name: 'type',
                            type: ApplicationCommandOptionType.String,
                            description: 'The type to display',
                            required: false,
                            choices: [
                                {
                                    name: 'Playing',
                                    value: 'PLAYING',
                                },
                                {
                                    name: 'Streaming',
                                    value: 'STREAMING',
                                },
                                {
                                    name: 'Listening',
                                    value: 'LISTENING',
                                },
                                {
                                    name: 'Watching',
                                    value: 'WATCHING',
                                },
                                {
                                    name: 'Competing',
                                    value: 'COMPETING',
                                },
                            ],
                        },
                        {
                            name: 'name',
                            type: ApplicationCommandOptionType.String,
                            description: 'The message/name to display',
                            required: false,
                        },
                        {
                            name: 'url',
                            type: ApplicationCommandOptionType.String,
                            description: 'The url to stream at',
                            required: false,
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
        const { i18n } = interaction;

        const responseEmbed = new BetterEmbed(interaction).setColor(Options.colorsNormal);

        if (interaction.options.getSubcommand() === 'set') {
            const type = interaction.options.getString('type', false);
            const name = interaction.options.getString('name', false);
            const url = interaction.options.getString('url', false);
            const status = interaction.options.getString('status', false);

            const currentPresence = interaction.client.user!.presence;
            const currentActivity = currentPresence.activities[0];

            this.container.customPresence = {
                activities: [
                    {
                        type: (type ?? currentActivity?.type) as Exclude<
                        ActivityType,
                        ActivityType.Custom
                        >,
                        name: name ?? currentActivity?.name,
                        // eslint-disable-next-line no-undefined
                        url: url ?? currentActivity?.url ?? undefined,
                    },
                ],
                status: (status ?? currentPresence.status) as PresenceStatusData,
            };

            responseEmbed.setTitle(i18n.getMessage('commandsPresenceSetTitle')).addFields(
                {
                    name: i18n.getMessage('commandsPresenceSetStatusName'),
                    value: status ?? currentPresence.status ?? i18n.getMessage('null'),
                },
                {
                    name: i18n.getMessage('commandsPresenceSetTypeName'),
                    value: type ?? String(currentActivity?.type) ?? i18n.getMessage('null'),
                },
                {
                    name: i18n.getMessage('commandsPresenceSetNameName'),
                    value: name ?? currentActivity?.name ?? i18n.getMessage('null'),
                },
                {
                    name: i18n.getMessage('commandsPresenceSetURLName'),
                    value: url ?? currentActivity?.url ?? i18n.getMessage('null'),
                },
            );
        } else {
            responseEmbed
                .setTitle(i18n.getMessage('commandsPresenceClearTitle'))
                .setDescription(i18n.getMessage('commandsPresenceClearTitle'));

            this.container.customPresence = null;
        }

        await setPresence();

        await interaction.editReply({
            embeds: [responseEmbed],
        });
    }
}
