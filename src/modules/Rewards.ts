import type { users as User } from '@prisma/client';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    DMChannel,
} from 'discord.js';
import { CustomIdType } from '../enums/CustomIdType';
import { Time } from '../enums/Time';
import { ErrorHandler } from '../errors/ErrorHandler';
import { i18n as Internationalization } from '../locales/i18n';
import { BetterEmbed } from '../structures/BetterEmbed';
import { CustomId } from '../structures/CustomId';
import { Logger } from '../structures/Logger';
import { Module } from '../structures/Module';
import { Modules } from '../structures/Modules';
import { Options } from '../utility/Options';
import { cleanLength, disableComponents } from '../utility/utility';

export class RewardsModule extends Module {
    public constructor(context: Module.Context, options: Module.Options) {
        super(context, {
            ...options,
            name: 'rewards',
            localizationFooter: 'modulesRewardsFooter',
            localizationName: 'modulesRewardsName',
            requireOnlineStatusAPI: false,
        });
    }

    /**
     * - Cron
     * - Continues alerting until user presses the button
     * - Button validates whether a user has actually claim their reward or not
     * - TODO: Add "missedNotifications" to prevent inactive users from killing this system
     * - TODO: Button cooldown?
     */

    public override async cron(user: User) {
        const config = await this.container.database.rewards.findUniqueOrThrow({
            where: {
                id: user.id,
            },
        });

        const i18n = new Internationalization(user.locale);
        const now = Date.now();
        const lastResetTime = this.lastResetTime(now);

        const surpassedInterval = config.lastNotification < lastResetTime
            // Time.Minute is for a bit of tolerance between notifications
            || config.lastNotification + config.interval - Time.Minute < now;

        this.container.logger.debug(
            this,
            Logger.moduleContext(user),
            `Reset Time: ${lastResetTime}`,
            `Now: ${now} ${new Date(now).toLocaleString()}`,
            `Last Notified: ${config.lastNotification}`,
        );

        // If the user has not been notified yet, or the interval has passed
        if (lastResetTime + config.delay <= now) {
            // Check missed notification count
            if (config.missedNotifications >= Options.modulesRewardsMissedNotificationsMax) {
                this.container.logger.info(
                    this,
                    Logger.moduleContext(user),
                    `Missed notification limit of ${Options.modulesRewardsMissedNotificationsMax} reached.`,
                );

                await this.container.database.$transaction([
                    // Reset missed notifications count
                    this.container.database.rewards.update({
                        data: {
                            missedNotifications: 0,
                        },
                        where: {
                            id: user.id,
                        },
                    }),
                    // Disable module
                    this.container.database.modules.update({
                        data: {
                            rewards: {
                                set: false,
                            },
                        },
                        where: {
                            id: user.id,
                        },
                    }),
                    // Create system message
                    this.container.database.system_messages.create({
                        data: {
                            id: user.id,
                            timestamp: Date.now(),
                            name_key: 'modulesRewardsMissedNotificationsLimitName',
                            value_key: 'modulesRewardsMissedNotificationsLimitValue',
                        },
                    }),
                ]);

                // Send DM
                const missedNotificationsLimitEmbed = new BetterEmbed()
                    .setColor(Options.colorsWarning)
                    .setTitle(i18n.getMessage('modulesRewardsMissedNotificationsLimitName'))
                    .setDescription(i18n.getMessage('modulesRewardsMissedNotificationsLimitValue'))
                    .setFooter({
                        text: i18n.getMessage(this.localizationFooter),
                    });

                const discordUser = await this.container.client.users.fetch(user.id);

                await discordUser.send({
                    embeds: [missedNotificationsLimitEmbed],
                });

                return;
            }

            const descriptionArray = i18n.getList('modulesRewardsReminderDescription');
            const random = Math.floor(Math.random() * descriptionArray.length);
            const description = descriptionArray[random]!;

            const rewardNotification = new BetterEmbed()
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('modulesRewardsReminderTitle'))
                .setDescription(description)
                .setFooter({
                    text: i18n.getMessage(this.localizationFooter),
                });

            // Send initial notification
            if (config.lastNotification < lastResetTime) {
                const discordUser = await this.container.client.users.fetch(user.id);
                const customId = CustomId.create({
                    module: this.name,
                    type: CustomIdType.Module,
                });

                const message = await discordUser.send({
                    embeds: [rewardNotification],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().setComponents(
                            new ButtonBuilder()
                                .setCustomId(customId)
                                .setLabel(i18n.getMessage('modulesRewardsCheckClaimStatusLabel'))
                                .setStyle(ButtonStyle.Primary),
                        ),
                    ],
                });

                await this.container.database.rewards.update({
                    data: {
                        lastNotification: now,
                    },
                    where: {
                        id: user.id,
                    },
                });

                this.container.logger.info(this, Logger.moduleContext(user), 'Delivered reminder.');

                await this.container.client.channels.fetch(message.channelId);

                const disabledRows = disableComponents(message.components);
                const endBoundary = now - lastResetTime + Time.Day;

                // Disable button after a day
                setTimeout(async () => {
                    try {
                        const updatedMessage = await message.fetch(true);
                        const button = updatedMessage.components[0]?.components[0];

                        // Check if button is still enabled
                        if (button && button.disabled === false) {
                            await message.edit({
                                components: disabledRows,
                            });

                            this.container.logger.debug(
                                this,
                                Logger.moduleContext(user),
                                `Disabled button after no activity for ${cleanLength(
                                    endBoundary,
                                )}.`,
                            );
                        }
                    } catch (error) {
                        new ErrorHandler(error).init();
                    }
                }, endBoundary);

                // Send follow up notification
            } else if (surpassedInterval && config.lastClaimedReward < lastResetTime) {
                const discordUser = await this.container.client.users.fetch(user.id);

                await discordUser.send({
                    embeds: [rewardNotification],
                });

                await this.container.database.rewards.update({
                    data: {
                        lastNotification: Date.now(),
                    },
                    where: {
                        id: user.id,
                    },
                });

                this.container.logger.info(
                    this,
                    Logger.moduleContext(user),
                    'Delivered follow up reminder.',
                );
            } else {
                this.container.logger.debug(
                    this,
                    Logger.moduleContext(user),
                    'No appropriate notification.',
                );
            }
        } else {
            this.container.logger.debug(this, Logger.moduleContext(user), 'Delay not surpassed.');
        }
    }

    public override async interaction(user: User, interaction: ButtonInteraction) {
        await this.container.database.rewards.update({
            data: {
                missedNotifications: 0,
            },
            where: {
                id: user.id,
            },
        });

        const player = (await Modules.fetch(user)).data;
        const config = await this.container.database.rewards.findUniqueOrThrow({
            where: {
                id: user.id,
            },
        });

        const i18n = new Internationalization(user.locale);
        const lastResetTime = this.lastResetTime();

        // Is the user's last claimed reward between the last midnight and the coming midnight
        const normalizedLastClaimed = Math.ceil((player.lastClaimedReward ?? 0) / 1000) * 1000;
        const hasClaimed = lastResetTime < normalizedLastClaimed;

        if (!hasClaimed) {
            const notClaimedNotification = new BetterEmbed()
                .setColor(Options.colorsWarning)
                .setTitle(i18n.getMessage('modulesRewardsNotClaimedNotificationTitle'))
                .setDescription(i18n.getMessage('modulesRewardsNotClaimedNotificationDescription'))
                .setFooter({
                    text: i18n.getMessage(this.localizationFooter),
                });

            this.container.logger.warn(
                this,
                Logger.moduleContext(user),
                'User has not claimed their reward.',
            );

            await interaction.reply({
                embeds: [notClaimedNotification],
                ephemeral: true,
            });

            return;
        }

        await this.container.database.rewards.update({
            data: {
                lastClaimedReward: player.lastClaimedReward ?? Date.now(),
            },
            where: {
                id: user.id,
            },
        });

        const milestone = Options.modulesRewardsMilestones.find(
            (item) => item === player.rewardScore,
        );

        const notificationEmbed = new BetterEmbed();

        if (config.milestones === true && milestone) {
            notificationEmbed
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('modulesRewardsMilestoneTitle'))
                .setDescription(i18n.getMessage('modulesRewardsMilestoneDescription', [milestone]))
                .setFooter({
                    text: i18n.getMessage(this.localizationFooter),
                });
        } else {
            notificationEmbed
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('modulesRewardsClaimedNotificationTitle'))
                .setDescription(
                    i18n.getMessage('modulesRewardsClaimedNotificationDescription', [
                        player.rewardScore ?? -1,
                        player.totalDailyRewards ?? -1,
                    ]),
                )
                .setFooter({
                    text: i18n.getMessage(this.localizationFooter),
                });
        }

        await interaction.reply({
            embeds: [notificationEmbed],
        });

        this.container.logger.info(
            this,
            Logger.moduleContext(user),
            config.milestones === true && milestone
                ? 'Delivered milestone.'
                : 'Delivered claimed notification.',
        );

        const channel = (await interaction.client.channels.fetch(
            interaction.channelId,
        )) as DMChannel;
        const message = await channel.messages.fetch(interaction.message.id);
        const disabledRows = disableComponents(message.components ?? []);

        await message.edit({
            components: disabledRows,
        });
    }

    private lastResetTime(nowParam?: number) {
        const now = nowParam || Date.now();
        const date = new Date(now);

        const hypixelTime = new Date(
            date.toLocaleString('en-US', {
                timeZone: Options.modulesRewardsHypixelTimezone,
            }),
        ).getTime() + date.getMilliseconds();

        const hypixelToClientOffset = hypixelTime - now;

        return new Date(hypixelTime).setHours(0, 0, 0, 0) - hypixelToClientOffset;
    }
}
