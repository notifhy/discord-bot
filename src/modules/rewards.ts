import type { RawRewardsModule, RewardsModule, UserAPIData } from '../@types/database';
import { BetterEmbed, cleanLength } from '../util/utility';
import { CleanHypixelPlayerData } from '../@types/hypixel';
import { Client } from 'discord.js';
import { SQLiteWrapper } from '../database';
import Constants from '../util/constants';
import errorHandler from '../util/error/errorHandler';
import ModuleError from '../util/error/ModuleError';

export const properties = {
  name: 'rewards',
};

type Differences = {
  primary: Partial<CleanHypixelPlayerData>,
  secondary: Partial<UserAPIData>,
};

export const execute = async ({
  client,
  userAPIData,
}: {
  client: Client,
  userAPIData: UserAPIData
}): Promise<void> => {
  try {
    const rewardsModule = await SQLiteWrapper.getUser<RawRewardsModule, RewardsModule>({
      discordID: userAPIData.discordID,
      table: 'rewards',
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
        table: 'rewards',
        data: {
          lastNotified: Date.now(),
        },
      });

      await user.send({
        embeds: [rewardNotification],
      });
      return;
    }
  } catch (error) {
    await errorHandler({
      error: new ModuleError({
        message: (error as Error).message,
        module: properties.name,
      }),
    });
  }
};