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

    public override async cron(user: User) {
        /**
         * Rewards module will:
         * - Will operate on an interval (30 minutes) and check for reminders to send out
         * - WIll operate on interactions
         *  - Actually validate if they actually claimed it OR
         *  - Simply update database or whatever
         */

        const i18n = new Internationalization(user.locale);

        const now = Date.now();

        const lastResetTime = this.lastResetTime();

        const bounds = Time.Minute * 15;

        const isAtResetTime = now + bounds > lastResetTime && now - bounds < lastResetTime;

        this.container.logger.debug(
            `User ${user.id}`,
            `${this.constructor.name}:`,
            `Reset Time: ${lastResetTime}`,
            `Now: ${now} ${new Date(now).toLocaleString()}`,
            now + bounds,
            now - bounds,
        );

        if (isAtResetTime) {
            const discordUser = await this.container.client.users.fetch(user.id);
            const descriptionArray = i18n.getList('modulesRewardsReminderDescription');
            const random = Math.floor(Math.random() * descriptionArray.length);
            const description = descriptionArray[random]!;

            const rewardNotification = new BetterEmbed({
                text: i18n.getMessage('modulesRewardsFooter'),
            })
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('modulesRewardsReminderTitle'))
                .setDescription(description);

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
                    user.id === i.user.id && i.message.id === message.id && i.customId === customId
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
        } else {
            const config = await this.container.database.rewards.findUniqueOrThrow({
                where: {
                    id: user.id,
                },
            });

            const surpassedInterval = config.lastNotified < lastResetTime
                || config.lastNotified + config.interval < Date.now();

            if (surpassedInterval === false) {
                return;
            }

            const player = await this.container.hypixel.player(user);

            // Is the user's last claimed reward between the last midnight and the coming midnight
            const normalizedLastClaimed = Math.ceil((player.lastClaimedReward ?? 0) / 1000) * 1000;
            const hasClaimed = lastResetTime < normalizedLastClaimed;

            if (hasClaimed) {
                return;
            }

            const discordUser = await this.container.client.users.fetch(user.id);
            const descriptionArray = i18n.getList('modulesRewardsReminderDescription');
            const random = Math.floor(Math.random() * descriptionArray.length);
            const description = descriptionArray[random]!;

            const rewardNotification = new BetterEmbed({
                text: i18n.getMessage('modulesRewardsFooter'),
            })
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('modulesRewardsReminderTitle'))
                .setDescription(description);

            await discordUser.send({
                embeds: [rewardNotification],
                components: [
                    new MessageActionRow().setComponents(
                        new MessageButton()
                            .setCustomId('a')
                            .setLabel('why')
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
                'Delivered follow up reminder.',
            );
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
        const hasClaimed = lastResetTime < Math.ceil((player.lastClaimedReward ?? 0) / 1000) * 1000;

        if (hasClaimed) {
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
