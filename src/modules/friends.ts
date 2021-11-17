import type { FriendsModule, RawFriendsModule, UserAPIData } from '../@types/database';
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
  const friendModules = await SQLiteWrapper.getUser<RawFriendsModule, FriendsModule>({
    discordID: userAPIData.discordID,
    table: 'friends',
    allowUndefined: false,
    columns: ['enabled', 'channel'],
  }) as FriendsModule;

  if (Object.keys(differences.primary).length < 1 || friendModules.enabled === false) return;
  if (differences.primary.lastLogin === undefined && differences.primary.lastLogout === undefined) return;

  if (differences.primary.lastLogin === null || differences.primary.lastLogout === null) {
    const user = await client.users.fetch(userAPIData.discordID);
    const undefinedData = new BetterEmbed({ color: '#AA0000', footer: { name: 'Notification' } })
      .setTitle('Missing Data')
      .setDescription('Your last login and/or last logout data returned undefined for the Friend module. Login and logout notifications are now disabled. This may be a result of disabling the `Online` API option on Hypixel or setting your social status to offline. Notifications will resume and you will receive another DM once this data is no longer missing.');
    await user.send({ embeds: [undefinedData] });
    return;
  }

  if ((differences.primary.lastLogin && differences.secondary.lastLogin === null) ||
  (differences.primary.lastLogout && differences.secondary.lastLogout === null)) {
    const user = await client.users.fetch(userAPIData.discordID);
    const undefinedData = new BetterEmbed({ color: '#00AA00', footer: { name: 'Notification' } })
      .setTitle('Received Data')
      .setDescription('Your last login and/or last logout data is no longer undefined for the Friend module. Login and logout notifications will now resume.');
    await user.send({ embeds: [undefinedData] });
    return;
  }

  const channel = await client.channels.fetch(friendModules.channel) as TextChannel;
  const notifications: MessageEmbed[] = [];

  if (differences.primary.lastLogin &&
    differences.primary.lastLogin + 60_000 >= Date.now()) {
    const login = new BetterEmbed({ color: '#00AA00', footer: { name: 'Notification' } })
      .setTitle('Login')
      .setDescription(`<@!${userAPIData.discordID}> logged in <t:${Math.round(differences.primary.lastLogin / 1000)}:R> at <t:${Math.round(differences.primary.lastLogin / 1000)}:T>!`);
    notifications.push(login);
  }

  if (differences.primary.lastLogout &&
    differences.primary.lastLogout + 60_000 >= Date.now()) {
    const logout = new BetterEmbed({ color: '#555555', footer: { name: 'Notification' } }) //Transparent NotifHy Icon
      .setTitle('Logout')
      .setDescription(`<@!${userAPIData.discordID}> logged out <t:${Math.round(differences.primary.lastLogout / 1000)}:R> at <t:${Math.round(differences.primary.lastLogout / 1000)}:T>!`);
    if (differences.primary.lastLogout > (differences.primary.lastLogin ?? 0)) notifications.push(logout);
    else notifications.unshift(logout);
  }

  if (notifications.length > 0) await channel.send({ embeds: notifications, allowedMentions: { parse: [] } });
};