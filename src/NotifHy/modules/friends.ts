import type { ClientModule } from '../@types/modules';
import type {
    FriendsModule,
    UserAPIData,
    UserData,
} from '../@types/database';
import {
    Formatters,
    MessageEmbed,
    TextChannel,
} from 'discord.js';
import {
    arrayRemove,
    timestamp,
} from '../../util/utility';
import { Log } from '../../util/Log';
import { RegionLocales } from '../../../locales/RegionLocales';
import { SQLite } from '../../util/SQLite';
import Constants from '../util/Constants';
import GlobalConstants from '../../util/Constants';
import ModuleError from '../errors/ModuleError';

export const properties: ClientModule['properties'] = {
    name: 'friends',
    cleanName: 'Friends Module',
    onlineStatusAPI: true,
};

export const execute: ClientModule['execute'] = async ({
    client,
    baseLocale,
    differences: { newData },
    userAPIData,
    userData,
}): Promise<void> => {
    try {
        if (
            newData.lastLogin === undefined &&
            newData.lastLogout === undefined
        ) {
            return; //If the login/logout aren't in differences
        }

        const friendModule =
            await SQLite.getUser<FriendsModule>({
                discordID: userAPIData.discordID,
                table: Constants.tables.friends,
                allowUndefined: false,
                columns: ['channel'],
            });

        const locale = baseLocale.friends;
        const { replace } = RegionLocales;

        const channel = (
            await client.channels.fetch(
                friendModule.channel!,
            )
        ) as TextChannel;

        const me = await channel.guild.members.fetch(client.user!.id);

        const missingPermissions = channel
            .permissionsFor(me)
            .missing(Constants.modules.friends.permissions);

        if (missingPermissions.length !== 0) {
            Log.error(userAPIData.discordID, `Friend Module: Missing ${missingPermissions.join(', ')}`);

            const newModules =
                arrayRemove(userAPIData.modules, 'friends') as string[];

            await SQLite.updateUser<UserAPIData>({
                discordID: userAPIData.discordID,
                table: Constants.tables.api,
                data: {
                    modules: newModules,
                },
            });

            const missingPermissionsField = {
                name: `${timestamp(Date.now(), 'D')} - ${locale.missingPermissions.name}`,
                value: replace(locale.missingPermissions.value, {
                    channel: Formatters.channelMention(friendModule.channel!),
                    missingPermissions: missingPermissions.join(', '),
                }),
            };

            await SQLite.updateUser<UserData>({
                discordID: userAPIData.discordID,
                table: Constants.tables.users,
                data: {
                    systemMessages: [
                        missingPermissionsField,
                        ...userData.systemMessages,
                    ],
                },
            });

            return;
        }

        const notifications: MessageEmbed[] = [];

        if (newData.lastLogin) {
            const relative = timestamp(newData.lastLogin, 'R');
            const time = timestamp(newData.lastLogin, 'T');

            const login = new MessageEmbed({
                color: Constants.colors.on,
            })
            .setDescription(replace(locale.login.description, {
                mention: Formatters.userMention(userAPIData.discordID),
                relative: relative!,
                time: time!,
            }));

            notifications.push(login);
        }

        if (newData.lastLogout) {
            const relative = timestamp(newData.lastLogout, 'R');
            const time = timestamp(newData.lastLogout, 'T');

            const logout = new MessageEmbed({
                color: Constants.colors.off,
            })
            .setDescription(replace(locale.logout.description, {
                mention: Formatters.userMention(userAPIData.discordID),
                relative: relative!,
                time: time!,
            }));

            //lastLogout seems to change twice sometimes on a single logout, this is a fix for that
            const lastEvent = userAPIData.history[1]; //First item in array is this event, so it checks the second item
            //@ts-expect-error hasOwn typing not implemented yet - https://github.com/microsoft/TypeScript/issues/44253
            const duplicationCheck = Object.hasOwn(lastEvent, 'lastLogout') &&
                newData.lastLogout - lastEvent.lastLogout! <
                GlobalConstants.ms.second * 2.5;

            if (duplicationCheck === false) {
                if (
                    newData.lastLogout >
                    (newData.lastLogin ?? 0)
                ) {
                    notifications.push(logout);
                } else {
                    notifications.unshift(logout);
                }
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
        throw new ModuleError({
            error: error,
            cleanModule: properties.cleanName,
            module: properties.name,
        });
    }
};