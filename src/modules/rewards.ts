import type { RawRewardsModule, RewardsModule, UserAPIData } from '../@types/database';
import { BetterEmbed } from '../util/utility';
import { CleanHypixelPlayerData } from '../@types/hypixel';
import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { ModuleError } from '../util/error/ModuleError';
import { SQLiteWrapper } from '../database';
import Constants from '../util/constants';
import errorHandler from '../util/error/errorHandler';

export const properties = {
  name: 'friendsEvent',
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

    const chicagoMS = new Date(new Date(date).toLocaleString('en-US', { timeZone: 'EST5EDT' })).getTime();
    const clientChicagoOffset = chicagoMS - date;

    const alertOffset = rewardsModule.alertTime!;
    const lastClaimedReward = userAPIData.lastClaimedReward!;
    const notificationInterval = rewardsModule.notificationInterval!;

    const hasClaimed = Boolean(chicagoMS + clientChicagoOffset - Constants.ms.day < lastClaimedReward);

    if (
      hasClaimed === false &&
      chicagoMS - alertOffset < Date.now() &&
      rewardsModule.lastNotified + notificationInterval < Date.now()
    ) {
      const user = await client.users.fetch(userAPIData.discordID);
      const rewardNotification = new BetterEmbed({ color: Constants.color.normal, footer: { name: 'Issue' } })
        .setTitle('Reward Reminder')
        .setDescription('You haven\'t claimed your daily reward yet!');

      await user.send({ embeds: [rewardNotification] });
      await SQLiteWrapper.updateUser<Partial<RewardsModule>, Partial<RewardsModule>>({
        discordID: userAPIData.discordID,
        table: 'rewards',
        data: {
          lastNotified: Date.now(),
        },
      });
      return;
    }
  } catch (error) {
    await errorHandler({ error: new ModuleError((error as Error).message) });
  }
};