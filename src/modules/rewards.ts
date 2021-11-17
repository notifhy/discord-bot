import type { RawRewardsModule, RewardsModule, UserAPIData } from '../@types/database';
import { BetterEmbed } from '../util/utility';
import { CleanHypixelPlayerData } from '../@types/hypixel';
import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { SQLiteWrapper } from '../database';

export const properties = {
  name: 'friendsEvent',
};

type Differences = {
  primary: Partial<CleanHypixelPlayerData>,
  secondary: Partial<UserAPIData>,
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
  const rewardsModule = await SQLiteWrapper.getUser<RawRewardsModule, RewardsModule>({
    discordID: userAPIData.discordID,
    table: 'friends',
    allowUndefined: false,
    columns: ['enabled', 'channel'],
  }) as RewardsModule;
};