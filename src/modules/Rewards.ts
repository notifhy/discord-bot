import type { users as User } from '@prisma/client';
import { ButtonInteraction, Constants, Message, MessageActionRow, MessageButton } from 'discord.js';
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
            localization: 'modulesRewardsName',
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

        const surpassedInterval = config.lastNotified < lastResetTime
            || config.lastNotified + config.interval < now;

        this.container.logger.debug(
            this,
            Logger.moduleContext(user),
            `Reset Time: ${lastResetTime}`,
            `Now: ${now} ${new Date(now).toLocaleString()}`,
            `Last Notified: ${config.lastNotified}`,
        );

        if (lastResetTime + config.delay <= now) {
            const descriptionArray = i18n.getList('modulesRewardsReminderDescription');
            const random = Math.floor(Math.random() * descriptionArray.length);
            const description = descriptionArray[random]!;

            const rewardNotification = new BetterEmbed({
                text: i18n.getMessage('modulesRewardsFooter'),
            })
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('modulesRewardsReminderTitle'))
                .setDescription(description);

            if (config.lastNotified < lastResetTime) {
                const discordUser = await this.container.client.users.fetch(user.id);
                const customId = CustomId.create({
                    module: this.name,
                    type: CustomIdType.Module,
                });

                const message = await discordUser.send({
                    embeds: [rewardNotification],
                    components: [
                        new MessageActionRow().setComponents(
                            new MessageButton()
                                .setCustomId(customId)
                                .setLabel(i18n.getMessage('modulesRewardsCheckClaimStatusLabel'))
                                .setStyle(Constants.MessageButtonStyles.PRIMARY),
                        ),
                    ],
                });

                await this.container.database.rewards.update({
                    data: {
                        lastNotified: now,
                    },
                    where: {
                        id: user.id,
                    },
                });

                this.container.logger.info(
                    this,
                    Logger.moduleContext(user),
                    'Delivered reminder.',
                );

                await this.container.client.channels.fetch(message.channelId);

                const disabledRows = disableComponents(message.components);

                const endBoundary = now - lastResetTime + Time.Day;

                setTimeout(async () => {
                    try {
                        await message.edit({
                            components: disabledRows,
                        });

                        this.container.logger.debug(
                            this,
                            Logger.moduleContext(user),
                            `Disabled button after no activity for ${cleanLength(endBoundary)}.`,
                        );
                    } catch (error) {
                        new ErrorHandler(error).init();
                    }
                }, endBoundary);
            } else if (surpassedInterval && config.lastClaimedReward < lastResetTime) {
                const discordUser = await this.container.client.users.fetch(user.id);
                await discordUser.send({
                    embeds: [rewardNotification],
                });

                await this.container.database.rewards.update({
                    data: {
                        lastNotified: Date.now(),
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
            this.container.logger.debug(
                this,
                Logger.moduleContext(user),
                'Delay not surpassed.',
            );
        }
    }

    public override async interaction(user: User, interaction: ButtonInteraction) {
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

        if (hasClaimed) {
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

            if (config.milestones === true && milestone) {
                const milestoneNotification = new BetterEmbed({
                    text: i18n.getMessage('modulesRewardsFooter'),
                })
                    .setColor(Options.colorsNormal)
                    .setTitle(i18n.getMessage('modulesRewardsMilestoneTitle'))
                    .setDescription(
                        i18n.getMessage('modulesRewardsMilestoneDescription', [milestone]),
                    );

                await interaction.reply({
                    embeds: [milestoneNotification],
                });

                this.container.logger.info(
                    this,
                    Logger.moduleContext(user),
                    'Delivered milestone.',
                );
            } else {
                const claimedNotification = new BetterEmbed({
                    text: i18n.getMessage('modulesRewardsFooter'),
                })
                    .setColor(Options.colorsNormal)
                    .setTitle(i18n.getMessage('modulesRewardsClaimedNotificationTitle'))
                    .setDescription(
                        i18n.getMessage('modulesRewardsClaimedNotificationDescription', [
                            player.rewardScore ?? -1,
                            player.totalDailyRewards ?? -1,
                        ]),
                    );

                await interaction.reply({
                    embeds: [claimedNotification],
                });

                this.container.logger.info(
                    this,
                    Logger.moduleContext(user),
                    'Delivered claimed notification.',
                );
            }

            const { message } = interaction;

            const disabledRows = disableComponents(message.components ?? []);

            if (message instanceof Message) {
                await message.edit({
                    components: disabledRows,
                });
            } else {
                // maybe works
                const dm = await (await this.container.client.users.fetch(user.id)).createDM();
                const newMessage = await dm.messages.fetch(message.id);
                await newMessage.edit({
                    components: disabledRows,
                });
            }
        } else {
            const notClaimedNotification = new BetterEmbed({
                text: i18n.getMessage('modulesRewardsFooter'),
            })
                .setColor(Options.colorsWarning)
                .setTitle(i18n.getMessage('modulesRewardsNotClaimedNotificationTitle'))
                .setDescription(i18n.getMessage('modulesRewardsNotClaimedNotificationDescription'));

            await interaction.reply({
                embeds: [notClaimedNotification],
                ephemeral: true,
            });
        }
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
