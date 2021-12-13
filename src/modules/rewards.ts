import type { Differences } from '../@types/modules';
import type {
    RawRewardsModule,
    RewardsModule,
    UserAPIData,
    UserData,
} from '../@types/database';
import { BetterEmbed } from '../util/utility';
import { Client } from 'discord.js';
import { RegionLocales } from '../../locales/localesHandler';
import { SQLiteWrapper } from '../database';
import Constants from '../util/Constants';
import ErrorHandler from '../util/errors/ErrorHandler';
import ModuleError from '../util/errors/ModuleError';

export const properties = {
    name: 'rewards',
};

export const execute = async ({
    client,
    differences,
    userAPIData,
}: {
    client: Client;
    differences: Differences;
    userAPIData: UserAPIData;
}): Promise<void> => {
    try {
        const rewardsModule = (await SQLiteWrapper.getUser<
            RawRewardsModule,
            RewardsModule
        >({
            discordID: userAPIData.discordID,
            table: Constants.tables.rewards,
            allowUndefined: false,
            columns: ['alertTime', 'lastNotified', 'notificationInterval'],
        })) as RewardsModule;

        const userData = (await SQLiteWrapper.getUser<UserData, UserData>({
            discordID: userAPIData.discordID,
            table: Constants.tables.users,
            allowUndefined: false,
            columns: ['language'],
        })) as UserData;

        const locale = RegionLocales.locale(userData.language).modules.rewards;
        const { replace } = RegionLocales;

        const date = Date.now();

        //Not ideal parsing a string but it should be fine
        const hypixelTime = new Date(
            new Date(date).toLocaleString('en-US', {
                timeZone: 'EST5EDT',
            }),
        ).getTime();

        const hypixelToClientOffset = hypixelTime - date;
        const nextResetTime =
            new Date(hypixelTime).setHours(24, 0, 0, 0) - hypixelToClientOffset;

        const alertOffset = rewardsModule.alertTime!;
        const lastClaimedReward = userAPIData.lastClaimedReward!;
        const notificationInterval = rewardsModule.notificationInterval!;

        //Is the user's last claimed reward between the past midnight and the coming midnight
        const hasClaimed = nextResetTime - Constants.ms.day < lastClaimedReward;

        if (
            hasClaimed === false &&
            nextResetTime - alertOffset < Date.now() &&
            rewardsModule.lastNotified + notificationInterval < Date.now()
        ) {
            const user = await client.users.fetch(userAPIData.discordID);
            const description =
                locale.rewardReminder.description[
                    Math.floor(
                        Math.random() *
                            locale.rewardReminder.description.length,
                    )
                ];
            const rewardNotification = new BetterEmbed({
                color: Constants.colors.normal,
                footer: {
                    name: locale.rewardReminder.footer,
                },
            })
                .setTitle(locale.rewardReminder.title)
                .setDescription(description);

            await SQLiteWrapper.updateUser<
                Partial<RewardsModule>,
                Partial<RewardsModule>
            >({
                discordID: userAPIData.discordID,
                table: Constants.tables.rewards,
                data: {
                    lastNotified: Date.now(),
                },
            });

            await user.send({
                embeds: [rewardNotification],
            });
        }

        if ( //Refactor after BetterEmbed is fixed and updated with a new method
            differences.primary.rewardScore !== undefined ||
            rewardsModule.milestones === true
        ) {
            const user = await client.users.fetch(userAPIData.discordID);
            const milestones = [
                7, 30, 60, 90, 100, 150, 200, 250, 300, 365, 500, 750, 1000,
            ];
            const milestone = milestones.find(
                item => item === differences.primary.rewardScore,
            );

            if (
                rewardsModule.milestones === true &&
                milestone !== undefined
            ) {
                const milestoneNotification = new BetterEmbed({
                    color: Constants.colors.normal,
                    footer: {
                        name: locale.milestone.footer,
                    },
                })
                    .setTitle(locale.milestone.title)
                    .setDescription(
                        replace(locale.milestone.description, {
                            milestone: milestone,
                        }),
                    );

                await user.send({
                    embeds: [milestoneNotification],
                });
            } else if (rewardsModule.claimNotification === true) {
                const claimedNotification = new BetterEmbed({
                    color: Constants.colors.normal,
                    footer: {
                        name: locale.claimedNotification.footer,
                    },
                })
                    .setTitle(locale.claimedNotification.title)
                    .setDescription(
                        replace(locale.claimedNotification.description, {
                            rewardScore: userAPIData.rewardScore ?? 0,
                            totalDailyRewards: userAPIData.totalDailyRewards ?? 0,
                        }),
                    );

                await user.send({
                    embeds: [claimedNotification],
                });
            }
        }
    } catch (error) {
        await new ErrorHandler({
            error: new ModuleError({
                message: (error as Error).message,
                module: properties.name,
                user: userAPIData,
            }),
            moduleUser: userAPIData,
        }).systemNotify();
    }
};
