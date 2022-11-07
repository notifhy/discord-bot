import type { users as User } from '@prisma/client';
import type { CleanHypixelData } from '../@types/Hypixel';
import type { Changes } from '../core/Data';
import { i18n as Internationalization } from '../locales/i18n';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Module } from '../structures/Module';
import { Options } from '../utility/Options';

export class RewardsModule extends Module {
    public constructor(context: Module.Context, options: Module.Options) {
        super(context, {
            ...options,
            name: 'rewards',
            localization: 'modulesRewardsName',
            requireOnlineStatusAPI: true,
        });
    }

    public async run(user: User, data: CleanHypixelData, changes: Changes) {
        const config = await this.container.database.rewards.findUniqueOrThrow({
            where: {
                id: user.id,
            },
        });

        const i18n = new Internationalization(user.locale);

        const date = Date.now();

        const hypixelTime = new Date(
            new Date(date).toLocaleString('en-US', {
                timeZone: 'EST5EDT',
            }),
        ).getTime();

        const hypixelToClientOffset = hypixelTime - date;

        const lastResetTime = new Date(hypixelTime).setHours(0, 0, 0, 0) - hypixelToClientOffset;

        // Is the user's last claimed reward between the last midnight and the coming midnight
        const hasClaimed = lastResetTime < Math.ceil((data.lastClaimedReward ?? 0) / 1000) * 1000;

        const surpassedInterval = config.lastNotified < lastResetTime
            ? true // Bypass for alerts from the previous daily reward
            : config.lastNotified + config.interval < Date.now();

        this.container.logger.debug(
            `User ${user.id}`,
            `${this.constructor.name}:`,
            `Last Reset: ${lastResetTime}.`,
            `Within User Notify Time: ${lastResetTime + config.delay < Date.now()}.`,
            `Has Not Claimed: ${hasClaimed === false}.`,
            `Surpassed Interval: ${surpassedInterval}.`,
        );

        if (
            lastResetTime + config.delay < Date.now() // Within user's notify time
            && hasClaimed === false // Claimed status
            && surpassedInterval // Has it been x amount of time since the last notif
        ) {
            const discordUser = await this.container.client.users.fetch(user.id);
            const descriptionArray = i18n.getList('modulesRewardsReminderDescription');
            const description = descriptionArray[
                Math.floor(Math.random() * descriptionArray.length)
            ]!;

            const rewardNotification = new BetterEmbed({
                text: i18n.getMessage('modulesRewardsFooter'),
            })
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('modulesRewardsReminderTitle'))
                .setDescription(description);

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
                'Delivered reminder.',
            );
        }

        if (changes.new.rewardScore && changes.new.totalDailyRewards) {
            const milestone = Options.modulesRewardsMilestones.find(
                (item) => item === changes.new.rewardScore,
            );

            if (config.milestones === true && milestone) {
                const discordUser = await this.container.client.users.fetch(user.id);
                const milestoneNotification = new BetterEmbed({
                    text: i18n.getMessage('modulesRewardsFooter'),
                })
                    .setColor(Options.colorsNormal)
                    .setTitle(i18n.getMessage('modulesRewardsMilestoneTitle'))
                    .setDescription(
                        i18n.getMessage('modulesRewardsMilestoneDescription', [milestone]),
                    );

                await discordUser.send({
                    embeds: [milestoneNotification],
                });

                this.container.logger.info(
                    `User ${user.id}`,
                    `${this.constructor.name}:`,
                    'Delivered milestone.',
                );
            } else if (config.claimNotification) {
                const discordUser = await this.container.client.users.fetch(user.id);
                const claimedNotification = new BetterEmbed({
                    text: i18n.getMessage('modulesRewardsFooter'),
                })
                    .setColor(Options.colorsNormal)
                    .setTitle(i18n.getMessage('modulesRewardsClaimNotificationTitle'))
                    .setDescription(
                        i18n.getMessage('modulesRewardsClaimNotificationDescription', [
                            changes.new.rewardScore,
                            changes.new.totalDailyRewards,
                        ]),
                    );

                await discordUser.send({
                    embeds: [claimedNotification],
                });

                this.container.logger.info(
                    `User ${user.id}`,
                    `${this.constructor.name}:`,
                    'Delivered claimed notification.',
                );
            }
        }
    }
}
