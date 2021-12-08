import type { Differences } from '../@types/modules';
import type { FriendsModule, RawFriendsModule, UserAPIData } from '../@types/database';
import { BetterEmbed } from '../util/utility';
import { Client, GuildMember, MessageEmbed, Permissions, TextChannel } from 'discord.js';
import { SQLiteWrapper } from '../database';
import Constants from '../util/Constants';
import ErrorHandler from '../util/errors/ErrorHandler';
import ModuleError from '../util/errors/ModuleError';

export const properties = {
  name: 'friends',
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
    if (
      differences.primary.lastLogin === undefined &&
      differences.primary.lastLogout === undefined
    ) return; //If the login/logout aren't in differences

    const friendModule = await SQLiteWrapper.getUser<RawFriendsModule, FriendsModule>({
      discordID: userAPIData.discordID,
      table: Constants.tables.friends,
      allowUndefined: false,
      columns: ['channel'],
    }) as FriendsModule;

    if (
      differences.primary.lastLogin === null ||
      differences.primary.lastLogout === null
    ) {
      const user = await client.users.fetch(userAPIData.discordID);
      const undefinedData = new BetterEmbed({
        color: Constants.color.warning,
        footer: {
          name: 'Issue',
        },
      })
        .setTitle('Missing Data')
        .setDescription('Your last login and/or last logout data returned undefined for the Friend module. Login and logout notifications are now disabled. This may be a result of disabling the `Online` API option on Hypixel or setting your social status to offline. Notifications will resume and you will receive another DM once this data is no longer missing.');

      await user.send({
        embeds: [undefinedData],
      });

      return;
    }

    if (
      (differences.primary.lastLogin && differences.secondary.lastLogin === null) ||
      (differences.primary.lastLogout && differences.secondary.lastLogout === null)
    ) {
      const user = await client.users.fetch(userAPIData.discordID);
      const undefinedData = new BetterEmbed({
        color: Constants.color.on,
        footer: {
          name: 'Notification',
        },
      })
        .setTitle('Received Data')
        .setDescription('Your last login and/or last logout data is no longer undefined for the Friend module. Login and logout notifications will now resume.');

      await user.send({
        embeds: [undefinedData],
      });

      return;
    }

    const channel = await client.channels.fetch(friendModule.channel!) as TextChannel;
    const missingPermissions = channel
      .permissionsFor(channel.guild.me as GuildMember)
      .missing([
        Permissions.FLAGS.EMBED_LINKS,
        Permissions.FLAGS.SEND_MESSAGES,
        Permissions.FLAGS.VIEW_CHANNEL,
      ]);

    if (missingPermissions.length !== 0) {
      const user = await client.users.fetch(userAPIData.discordID);
      const missingEmbed = new BetterEmbed({
        color: Constants.color.warning,
        footer: {
          name: 'Issue',
        },
      })
        .setTitle('Missing Permissions')
        .setDescription(`This bot is missing the following permissions in the channel <#${friendModule.channel}>: ${missingPermissions.join(', ')}. The Friends Module has been toggled off due to this issue.`);

      userAPIData.modules.splice(userAPIData.modules.indexOf('friends'), 1);

      await SQLiteWrapper.updateUser<Partial<UserAPIData>, Partial<UserAPIData>>({
        discordID: userAPIData.discordID,
        table: Constants.tables.friends,
        data: {
          modules: userAPIData.modules,
        },
      });

      await user.send({
        embeds: [missingEmbed],
      });

      return;
    }

    if (friendModule.suppressNext === true) {
      const user = await client.users.fetch(userAPIData.discordID);
      const suppressedEmbed = new BetterEmbed({
        color: Constants.color.normal,
        footer: {
          name: 'Notification',
        },
      })
        .setTitle('Alert Suppressed')
        .setDescription(`Your latest alert for the Friend Module has been suppressed, and login/logout notifications will now resume.`);

      await SQLiteWrapper.updateUser<Partial<FriendsModule>, Partial<RawFriendsModule>>({
        discordID: userAPIData.discordID,
        table: 'api',
        data: {
          suppressNext: false,
        },
      });

      await user.send({
        embeds: [suppressedEmbed],
      });

      return;
    }

    const notifications: MessageEmbed[] = [];

    if (
      differences.primary.lastLogin &&
      differences.primary.lastLogin + Constants.ms.minute >= Date.now()
    ) {
      const login = new MessageEmbed({
        color: Constants.color.on,
      })
        .setDescription(`<@!${userAPIData.discordID}> logged in <t:${Math.round(differences.primary.lastLogin / Constants.ms.second)}:R> at <t:${Math.round(differences.primary.lastLogin / Constants.ms.second)}:T>`);

      notifications.push(login);
    }

    if (
      differences.primary.lastLogout &&
      differences.primary.lastLogout + Constants.ms.minute >= Date.now()
    ) {
      const logout = new MessageEmbed({
        color: Constants.color.off,
      })
        .setDescription(`<@!${userAPIData.discordID}> logged out <t:${Math.round(differences.primary.lastLogout / Constants.ms.second)}:R> at <t:${Math.round(differences.primary.lastLogout / Constants.ms.second)}:T>`);

      //lastLogout seems to change twice sometimes on a single logout, this is a fix for that
      const [, lastEvent] = userAPIData.history; //First item in array is this event, so it checks the second item
      const duplicationCheck = 'lastLogout' in lastEvent;

      if (duplicationCheck === false) {
        if (differences.primary.lastLogout > (differences.primary.lastLogin ?? 0)) notifications.push(logout);
        else notifications.unshift(logout);
      }
    }

    if (notifications.length > 0) {
      await channel.send({
        embeds: notifications,
        allowedMentions: {
          parse: [],
        },
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