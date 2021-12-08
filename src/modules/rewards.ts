import type { RawRewardsModule, RewardsModule, UserAPIData } from '../@types/database';
import { BetterEmbed } from '../util/utility';
import { Client } from 'discord.js';
import { SQLiteWrapper } from '../database';
import Constants from '../util/Constants';
import ErrorHandler from '../util/errors/ErrorHandler';
import ModuleError from '../util/errors/ModuleError';
import type { Differences } from '../@types/modules';

export const properties = {
  name: 'rewards',
};

export const execute = async ({
  client,
  differences,
  userAPIData,
}: {
  client: Client,
  differences: Differences,
  userAPIData: UserAPIData
}): Promise<void> => {
  try {
    const rewardsModule = await SQLiteWrapper.getUser<RawRewardsModule, RewardsModule>({
      discordID: userAPIData.discordID,
      table: Constants.tables.rewards,
      allowUndefined: false,
      columns: ['alertTime', 'lastNotified', 'notificationInterval'],
    }) as RewardsModule;

    const date = Date.now();

    //Not ideal parsing a string but it should be fine
    const hypixelTime = new Date(
      new Date(date).toLocaleString('en-US', {
        timeZone: 'EST5EDT',
      },
    )).getTime();

    const hypixelToClientOffset = hypixelTime - date;
    const nextResetTime = new Date(hypixelTime).setHours(24, 0, 0, 0) - hypixelToClientOffset;

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
      const rewardNotification = new BetterEmbed({
        color: Constants.color.normal,
        footer: {
          name: 'Notification',
        },
      })
        .setTitle('Daily Reward Reminder')
        .setDescription('You haven\'t claimed your daily reward yet!');

      await SQLiteWrapper.updateUser<Partial<RewardsModule>, Partial<RewardsModule>>({
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

    if (
      differences.primary.rewardScore === undefined ||
      rewardsModule.milestones === false
    ) {
      return;
    }

    const milestones = [7, 30, 60, 90, 100, 150, 200, 250, 300, 365, 500, 750, 1000];
    const milestone = milestones.find(item => item === differences.primary.rewardScore);

    if (milestone) {
      const user = await client.users.fetch(userAPIData.discordID);
      const milestoneNotification = new BetterEmbed({
        color: Constants.color.normal,
        footer: {
          name: 'Notification',
        },
      })
        .setTitle('Congratulations')
        .setDescription(`🎉 You have reached a daily streak of ${milestone}! To opt out of future milestone messages, uae /modules`);

      await user.send({
        embeds: [milestoneNotification],
      });
    }
  } catch (error) {
    const handler = new ErrorHandler({
      error: new ModuleError({
        message: (error as Error).message,
        module: properties.name,
        user: userAPIData,
      }),
      moduleUser: userAPIData,
    });

    await handler.systemNotify();
  }
};