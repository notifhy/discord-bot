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
    BetterEmbed,
    timestamp,
} from '../util/utility';
import { ModuleHandler } from '../module/ModuleHandler';
import { RegionLocales } from '../../locales/RegionLocales';
import { SQLite } from '../util/SQLite';
import Constants from '../util/Constants';
import ModuleError from '../util/errors/ModuleError';
import { Log } from '../util/Log';

export const properties = {
    name: 'friends',
    cleanName: 'Friends',
};

export const execute = async ({
    client,
    differences,
    userAPIData,
}: ModuleHandler,
): Promise<void> => {
    try {
        if (
            differences.primary.lastLogin === undefined &&
            differences.primary.lastLogout === undefined
        ) {
            return; //If the login/logout aren't in differences
        }

        const friendModule = (
            await SQLite.getUser<FriendsModule>({
                discordID: userAPIData.discordID,
                table: Constants.tables.friends,
                allowUndefined: false,
                columns: ['channel'],
            })
        ) as FriendsModule;

        const userData = (
            await SQLite.getUser<UserData>({
                discordID: userAPIData.discordID,
                table: Constants.tables.users,
                allowUndefined: false,
                columns: [
                    'locale',
                    'localeOverride',
                    'systemMessages',
                ],
            })
        ) as UserData;

        const locale = RegionLocales.locale(
            userData.localeOverride ?? userData.locale,
        ).modules.friends;
        const { replace } = RegionLocales;

        if (
            differences.primary.lastLogin === null ||
            differences.primary.lastLogout === null
        ) {
            const user = await client.users.fetch(userAPIData.discordID);
            const undefinedData = new BetterEmbed({
                name: locale.missingData.footer,
            })
                .setColor(Constants.colors.warning)
                .setTitle(locale.missingData.title)
                .setDescription(locale.missingData.description);

            await user.send({
                embeds: [undefinedData],
            });

            return;
        }

        if (
            (differences.primary.lastLogin &&
                differences.secondary.lastLogin === null) ||
            (differences.primary.lastLogout &&
                differences.secondary.lastLogout === null)
        ) {
            const user = await client.users.fetch(userAPIData.discordID);
            const undefinedData = new BetterEmbed({
                name: locale.receivedData.footer,
            })
                .setColor(Constants.colors.on)
                .setTitle(locale.receivedData.title)
                .setDescription(locale.receivedData.description);

            await user.send({
                embeds: [undefinedData],
            });

            return;
        }

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

            await SQLite.updateUser<
            UserAPIData
            >({
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

            await SQLite.updateUser<
                UserData
            >({
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

        if (differences.primary.lastLogin) {
            const relative = timestamp(differences.primary.lastLogin, 'R');
            const time = timestamp(differences.primary.lastLogin, 'T');

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

        if (differences.primary.lastLogout) {
            const relative = timestamp(differences.primary.lastLogout, 'R');
            const time = timestamp(differences.primary.lastLogout, 'T');

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
                differences.primary.lastLogout - lastEvent.lastLogout! < Constants.ms.second * 2.5;

            if (duplicationCheck === false) {
                if (
                    differences.primary.lastLogout >
                    (differences.primary.lastLogin ?? 0)
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
