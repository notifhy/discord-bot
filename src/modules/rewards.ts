import type {
    RawRewardsModule,
    RewardsModule,
    UserData,
} from '../@types/database';
import { BetterEmbed } from '../util/utility';
import { ModuleHandler } from '../module/ModuleHandler';
import { RegionLocales } from '../../locales/localesHandler';
import { SQLiteWrapper } from '../database';
import Constants from '../util/Constants';
import ModuleError from '../util/errors/ModuleError';

export const properties = {
    name: 'rewards',
};

export const execute = async ({
    client,
    differences,
    userAPIData,
}: ModuleHandler,
): Promise<void> => {
    try {
        const rewardsModule = (await SQLiteWrapper.getUser<
            RawRewardsModule,
            RewardsModule
        >({
            discordID: userAPIData.discordID,
            table: Constants.tables.rewards,
            allowUndefined: false,
            columns: [
                'alertTime',
                'claimNotification',
                'lastNotified',
                'milestones',
                'notificationInterval',
            ],
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
                timeZone: Constants.modules.rewards.hypixelTimezone,
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

        const surpassedInterval =
            rewardsModule.lastNotified < nextResetTime - Constants.ms.day
                ? true //Bypass for alerts from the previous daily reward
                : rewardsModule.lastNotified + notificationInterval <
                  Date.now();

        if (
            hasClaimed === false && //Claimed status
            nextResetTime - alertOffset < Date.now() && //Within user's notify time
            surpassedInterval === true //Has it been x amount of time since the last notif
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
                name: locale.rewardReminder.footer,
            })
                .setColor(Constants.colors.normal)
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

        if (differences.primary.rewardScore === undefined) {
            return;
        }

        if (rewardsModule.milestones === true) {
            const user = await client.users.fetch(userAPIData.discordID);
            const milestones = Constants.modules.rewards.milestones;
            const milestone = milestones.find(
                item => item === differences.primary.rewardScore,
            );

            if (rewardsModule.milestones === true && milestone !== undefined) {
                const milestoneNotification = new BetterEmbed({
                    name: locale.milestone.footer,
                })
                    .setColor(Constants.colors.normal)
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
                    name: locale.claimedNotification.footer,
                })
                    .setColor(Constants.colors.normal)
                    .setTitle(locale.claimedNotification.title)
                    .setDescription(
                        replace(locale.claimedNotification.description, {
                            rewardScore: userAPIData.rewardScore ?? 0,
                            totalDailyRewards:
                                userAPIData.totalDailyRewards ?? 0,
                        }),
                    );

                await user.send({
                    embeds: [claimedNotification],
                });
            }
        }
    } catch (error) {
        throw new ModuleError({
            error: error,
            module: properties.name,
        });
    }
};
