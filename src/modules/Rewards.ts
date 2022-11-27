import type { users as User } from '@prisma/client';
import {
    ButtonInteraction,
    Constants,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
} from 'discord.js';
import { Time } from '../enums/Time';
import { ErrorHandler } from '../errors/ErrorHandler';
import { InteractionErrorHandler } from '../errors/InteractionErrorHandler';
import { i18n as Internationalization } from '../locales/i18n';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Module } from '../structures/Module';
import { Options } from '../utility/Options';
import { disableComponents } from '../utility/utility';

export class RewardsModule extends Module {
    public constructor(context: Module.Context, options: Module.Options) {
        super(context, {
            ...options,
            name: 'rewards',
            localization: 'modulesRewardsName',
            cronIncludeAPIData: false,
        });
    }

    /**
     * - Cron
     * - Continues alerting until user presses the button
     * - Button validates whether a user has actually claim their reward or not
     * - TODO: Add "missedNotifications" to prevent inactive users from killing this system
     */
    public override async cron(user: User) {
        const config = await this.container.database.rewards.findUniqueOrThrow({
            where: {
                id: user.id,
            },
        });

        const i18n = new Internationalization(user.locale);
        const now = Date.now();
        const lastResetTime = this.lastResetTime();
        const bounds = Time.Minute * 15;

        const surpassedInterval = config.lastNotified < lastResetTime
            || config.lastNotified + config.interval < Date.now();

        this.container.logger.debug(
            `User ${user.id}`,
            `${this.constructor.name}:`,
            `Reset Time: ${lastResetTime}`,
            `Now: ${now} ${new Date(now).toLocaleString()}`,
            now + bounds,
            now - bounds,
        );

        if (lastResetTime + config.delay < Date.now()) {
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
                const customId = String(Date.now());

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
                        lastNotified: Date.now(),
                    },
                    where: {
                        id: user.id,
                    },
                });

                this.container.logger.info(
                    `User ${user.id}`,
                    `${this.constructor.name}:`,
                    'Delivered reminder.',
                );

                await this.container.client.channels.fetch(message.channelId);

                // eslint-disable-next-line arrow-body-style
                const componentFilter = (i: MessageComponentInteraction) => {
                    return (
                        user.id === i.user.id
                        && i.message.id === message.id
                        && i.customId === customId
                    );
                };

                const collector = message.createMessageComponentCollector({
                    componentType: Constants.MessageComponentTypes.BUTTON,
                    filter: componentFilter,
                    time: lastResetTime + Time.Day - Date.now(),
                });

                const disabledRows = disableComponents(message.components);

                collector.on('collect', async (interaction: ButtonInteraction) => {
                    try {
                        await this.interaction(user, interaction);
                    } catch (error) {
                        await new InteractionErrorHandler(error, interaction).init();
                    }
                });

                collector.on('end', async () => {
                    try {
                        await message.edit({
                            components: disabledRows,
                        });
                    } catch (error) {
                        new ErrorHandler(error).init();
                    }
                });
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
                    `User ${user.id}`,
                    `${this.constructor.name}:`,
                    'Delivered follow up reminder.',
                );
            }
        }
    }

    private async interaction(user: User, interaction: ButtonInteraction) {
        const player = await this.container.hypixel.player(user);
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
                    `User ${user.id}`,
                    `${this.constructor.name}:`,
                    'Delivered milestone.',
                );
            } else {
                const claimedNotification = new BetterEmbed({
                    text: i18n.getMessage('modulesRewardsFooter'),
                })
                    .setColor(Options.colorsNormal)
                    .setTitle(i18n.getMessage('modulesRewardsClaimedNotificationTitle'))
                    .setDescription(
                        i18n.getMessage('modulesRewardsNotClaimedNotificationDescription'),
                    );

                await interaction.reply({
                    embeds: [claimedNotification],
                });

                this.container.logger.info(
                    `User ${user.id}`,
                    `${this.constructor.name}:`,
                    'Delivered claimed notification.',
                );
            }

            const message = await interaction.channel!.messages.fetch(interaction.message.id);

            const disabledRows = disableComponents(message.components);

            await message.edit({
                components: disabledRows,
            });
        } else {
            const notClaimedNotification = new BetterEmbed({
                text: i18n.getMessage('modulesRewardsFooter'),
            })
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('modulesRewardsNotClaimedNotificationTitle'))
                .setDescription(i18n.getMessage('modulesRewardsNotClaimedNotificationDescription'));

            await interaction.reply({
                embeds: [notClaimedNotification],
                ephemeral: true,
            });
        }
    }

    private lastResetTime() {
        const now = Date.now();

        const hypixelTime = new Date(
            new Date(now).toLocaleString('en-US', {
                timeZone: Options.modulesRewardsHypixelTimezone,
            }),
        ).getTime();

        const hypixelToClientOffset = hypixelTime - now;

        return new Date(hypixelTime).setHours(0, 0, 0, 0) - hypixelToClientOffset;
    }
}
