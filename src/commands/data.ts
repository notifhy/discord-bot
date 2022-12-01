import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import {
    type CommandInteraction,
    Constants,
    type Message,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
} from 'discord.js';
import type { CleanHypixelData } from '../@types/Hypixel';
import { Time } from '../enums/Time';
import { InteractionErrorHandler } from '../errors/InteractionErrorHandler';
import type { MessageKeys } from '../locales/locales';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Hypixel } from '../structures/Hypixel';
import { Logger } from '../structures/Logger';
import { Options } from '../utility/Options';
import {
    awaitComponent,
    capitolToNormal,
    cleanGameMode,
    cleanGameType,
    disableComponents,
    setPresence,
    timestamp,
} from '../utility/utility';

export class DataCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'data',
            description: 'View or delete your stored by this bot',
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
                    name: 'delete',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    description: 'Delete your data',
                },
                {
                    name: 'view',
                    description: 'View your data',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                    options: [
                        {
                            name: 'all',
                            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                            description: 'Returns a file with all of your player data',
                        },
                        {
                            name: 'history',
                            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                            description: 'Returns an interface that displays your player history',
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
                await this.viewAll(interaction);
                break;
            case 'delete':
                await this.delete(interaction);
                break;
            case 'history':
                await this.viewHistory(interaction);
                break;
            default:
                throw new RangeError();
        }
    }

    private async delete(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const confirmEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsDataDeleteConfirmTitle'))
            .setDescription(i18n.getMessage('commandsDataDeleteConfirmDescription'));

        const yesButton = new MessageButton()
            .setCustomId('true')
            .setLabel(i18n.getMessage('yes'))
            .setStyle(Constants.MessageButtonStyles.SUCCESS);

        const noButton = new MessageButton()
            .setCustomId('false')
            .setLabel(i18n.getMessage('no'))
            .setStyle(Constants.MessageButtonStyles.DANGER);

        const buttons = new MessageActionRow().addComponents(yesButton, noButton);

        const message = (await interaction.editReply({
            embeds: [confirmEmbed],
            components: [buttons],
        })) as Message;

        const disabledRows = disableComponents(message.components);

        await interaction.client.channels.fetch(interaction.channelId);

        // eslint-disable-next-line arrow-body-style
        const componentFilter = (i: MessageComponentInteraction) => {
            return interaction.user.id === i.user.id && i.message.id === message.id;
        };

        const button = await awaitComponent(interaction.channel!, {
            componentType: Constants.MessageComponentTypes.BUTTON,
            filter: componentFilter,
            idle: Time.Second * 30,
        });

        if (button === null) {
            this.container.logger.info(
                this,
                Logger.interactionLogContext(interaction),
                'Ran out of time.',
            );

            await interaction.editReply({
                components: disabledRows,
            });

            return;
        }

        if (button.customId === noButton.customId) {
            this.container.logger.info(
                this,
                Logger.interactionLogContext(interaction),
                'Pressed no.',
            );

            await button.update({
                components: disabledRows,
            });

            return;
        }

        await this.container.database.$transaction([
            this.container.database.system_messages.deleteMany({
                where: {
                    id: interaction.user.id,
                },
            }),
            this.container.database.activities.deleteMany({
                where: {
                    id: interaction.user.id,
                },
            }),
            this.container.database.users.delete({
                where: {
                    id: interaction.user.id,
                },
            }),
            this.container.database.defender.delete({
                where: {
                    id: interaction.user.id,
                },
            }),
            this.container.database.friends.delete({
                where: {
                    id: interaction.user.id,
                },
            }),
            this.container.database.modules.delete({
                where: {
                    id: interaction.user.id,
                },
            }),
            this.container.database.rewards.delete({
                where: {
                    id: interaction.user.id,
                },
            }),
        ]);

        const deleted = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsDataDeleteDeletedTitle'))
            .setDescription(i18n.getMessage('commandsDataDeleteDeletedDescription'));

        this.container.logger.info(
            this,
            Logger.interactionLogContext(interaction),
            'Accepted data deletion.',
        );

        await button.update({
            embeds: [deleted],
            components: disabledRows,
        });

        await setPresence();
    }

    private async viewAll(interaction: CommandInteraction) {
        const data = await this.container.database.users.findUnique({
            include: {
                activities: {
                    orderBy: {
                        index: 'asc',
                    },
                },
                defender: true,
                friends: true,
                modules: true,
                rewards: true,
                system_messages: {
                    orderBy: {
                        index: 'asc',
                    },
                },
            },
            where: {
                id: interaction.user.id,
            },
        });

        await interaction.editReply({
            files: [
                {
                    attachment: Buffer.from(JSON.stringify(data, null, 2)),
                    name: 'data.json',
                },
            ],
        });
    }

    private async viewHistory(interaction: CommandInteraction) {
        let total = await this.container.database.activities.count({
            where: {
                id: interaction.user.id,
            },
        });

        const reply = await interaction.editReply(
            await this.generateHistoryPage(interaction, 0, total),
        );

        await interaction.client.channels.fetch(interaction.channelId);

        // eslint-disable-next-line arrow-body-style
        const filter = (i: MessageComponentInteraction) => {
            return interaction.user.id === i.user.id && i.message.id === reply.id;
        };

        const collector = interaction.channel!.createMessageComponentCollector({
            filter: filter,
            idle: Time.Minute * 5,
            time: Time.Minute * 30,
        });

        let index = 0;

        collector.on('collect', async (i) => {
            try {
                switch (i.customId) {
                    case 'fastBackward':
                        index -= Options.dataHistoryFast;
                        break;
                    case 'backward':
                        index -= Options.dataHistorySlow;
                        break;
                    case 'forward':
                        index += Options.dataHistorySlow;
                        break;
                    case 'fastForward':
                        index += Options.dataHistoryFast;
                        break;
                    default:
                        throw new RangeError();
                }

                total = await this.container.database.activities.count({
                    where: {
                        id: interaction.user.id,
                    },
                });

                await i.update(await this.generateHistoryPage(interaction, index, total));
            } catch (error) {
                new InteractionErrorHandler(error, interaction).init();
            }
        });

        collector.on('end', async () => {
            try {
                const message = (await interaction.fetchReply()) as Message;
                const disabledRows = disableComponents(message.components);

                await interaction.editReply({
                    components: disabledRows,
                });
            } catch (error) {
                new InteractionErrorHandler(error, interaction).init();
            }
        });
    }

    private async generateHistoryPage(
        interaction: CommandInteraction,
        index: number,
        total: number,
    ) {
        const activities = await this.container.database.activities.findMany({
            select: {
                timestamp: true,
                firstLogin: true,
                lastLogin: true,
                lastLogout: true,
                version: true,
                language: true,
                gameType: true,
                gameMode: true,
                gameMap: true,
                lastClaimedReward: true,
                rewardScore: true,
                rewardHighScore: true,
                totalDailyRewards: true,
                totalRewards: true,
            },
            orderBy: {
                index: 'desc',
            },
            skip: index,
            take: Options.dataHistorySlow + 1,
            where: {
                id: interaction.user.id,
            },
        });

        const { i18n } = interaction;

        const embed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsDataHistoryTitle'))
            .setDescription(
                i18n.getMessage('commandsDataHistoryDescription', [
                    index ?? 0,
                    (index ?? 0) + Options.dataHistorySlow,
                    total,
                ]),
            );

        for (let i = 0; i < Math.min(Options.dataHistorySlow, activities.length); i += 1) {
            const { timestamp: time, ...activityNewer } = activities[i]!;
            const possibleActivityOld = activities[i + 1];

            let subject: Partial<CleanHypixelData> = activityNewer;

            if (possibleActivityOld) {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                const { timestamp: _, ...activityOlder } = possibleActivityOld;
                subject = Hypixel.changes(activityNewer, activityOlder).new;
            }

            embed.addFields({
                name: `${timestamp(time, 'D')} ${timestamp(time, 'T')}`,
                value: Object.entries(subject)
                    .map(([key, value]) => this.formatValue(interaction, key, value))
                    .join('\n'),
                inline: true,
            });
        }

        const base = new MessageButton().setStyle(Constants.MessageButtonStyles.PRIMARY);

        const fastLeftButton = new MessageButton(base)
            .setCustomId('fastBackward')
            .setEmoji(Options.emojiFastBackward)
            .setDisabled(index - Options.dataHistoryFast < 0);

        const leftButton = new MessageButton(base)
            .setCustomId('backward')
            .setEmoji(Options.emojiSlowBackward)
            .setDisabled(index - Options.dataHistorySlow < 0);

        const rightButton = new MessageButton(base)
            .setCustomId('forward')
            .setEmoji(Options.emojiSlowForward)
            .setDisabled(index + Options.dataHistorySlow >= total);

        const fastRightButton = new MessageButton(base)
            .setCustomId('fastForward')
            .setEmoji(Options.emojiFastForward)
            .setDisabled(index + Options.dataHistoryFast >= total);

        const buttons = new MessageActionRow().setComponents(
            fastLeftButton,
            leftButton,
            rightButton,
            fastRightButton,
        );

        return {
            components: [buttons],
            embeds: [embed],
        };
    }

    private formatValue(
        interaction: CommandInteraction,
        key: string,
        value: number | string | null,
    ) {
        const epoch = /^\d{13,}$/;
        const { i18n } = interaction;

        if (String(value).match(epoch)) {
            return i18n.getMessage(`commandsDataHistoryValues+${key}` as keyof MessageKeys, [
                timestamp(value as number, 'T'),
            ]);
        }

        if (key === 'gameType') {
            return i18n.getMessage(`commandsDataHistoryValues+${key}` as keyof MessageKeys, [
                cleanGameType(String(value ?? i18n.getMessage('none'))),
            ]);
        }

        if (key === 'gameMode') {
            return i18n.getMessage(`commandsDataHistoryValues+${key}` as keyof MessageKeys, [
                cleanGameMode(String(value ?? i18n.getMessage('none'))),
            ]);
        }

        return i18n.getMessage(`commandsDataHistoryValues+${key}` as keyof MessageKeys, [
            capitolToNormal(String(value ?? i18n.getMessage('null'))),
        ]);
    }
}
