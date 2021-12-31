import type {
    FriendsModule,
    RawFriendsModule,
    UserAPIData,
    UserData,
} from '../@types/database';
import {
    GuildMember,
    MessageEmbed,
    TextChannel,
} from 'discord.js';
import { BetterEmbed } from '../util/utility';
import { ModuleHandler } from '../module/ModuleHandler';
import { RegionLocales } from '../../locales/localesHandler';
import { SQLiteWrapper } from '../database';
import Constants from '../util/Constants';
import ModuleError from '../util/errors/ModuleError';

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
            await SQLiteWrapper.getUser<
                RawFriendsModule,
                FriendsModule
            >({
                discordID: userAPIData.discordID,
                table: Constants.tables.friends,
                allowUndefined: false,
                columns: ['channel'],
            })
        ) as FriendsModule;

        const userData = (
            await SQLiteWrapper.getUser<
                UserData,
                UserData
            >({
                discordID: userAPIData.discordID,
                table: Constants.tables.users,
                allowUndefined: false,
                columns: ['language'],
            })
        ) as UserData;

        const locale = RegionLocales.locale(userData.language).modules.friends;
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

        const missingPermissions = channel
            .permissionsFor(channel.guild.me as GuildMember)
            .missing(Constants.modules.friends.permissions);

        if (missingPermissions.length !== 0) {
            const user = await client.users.fetch(userAPIData.discordID);
            const missingEmbed = new BetterEmbed({
                name: locale.missingPermissions.footer,
            })
                .setColor(Constants.colors.warning)
                .setTitle(locale.missingPermissions.title)
                .setDescription(replace(locale.missingPermissions.description, {
                    channelID: friendModule.channel!,
                    missingPermissions: missingPermissions.join(', '),
                }));

            userAPIData.modules.splice(
                userAPIData.modules.indexOf('friends'),
                1,
            );

            await SQLiteWrapper.updateUser<
                Partial<UserAPIData>,
                Partial<UserAPIData>
            >({
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

        if (friendModule.suppressNext === true) { //Unused currently
            const user = await client.users.fetch(userAPIData.discordID);
            const suppressedEmbed = new BetterEmbed({
                name: locale.suppressNext.footer,
            })
                .setColor(Constants.colors.normal)
                .setTitle(locale.suppressNext.title)
                .setDescription(locale.suppressNext.description);

            await SQLiteWrapper.updateUser<
                Partial<FriendsModule>,
                Partial<RawFriendsModule>
            >({
                discordID: userAPIData.discordID,
                table: Constants.tables.friends,
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

        if (differences.primary.lastLogin) {
            const unixEpoch = Math.round(
                differences.primary.lastLogin / Constants.ms.second,
            );
            const login = new MessageEmbed({
                color: Constants.colors.on,
            })
            .setDescription(replace(locale.login.description, {
                discordID: userAPIData.discordID,
                unixEpoch: unixEpoch,
            }));

            notifications.push(login);
        }

        if (differences.primary.lastLogout) {
            const unixEpoch = Math.round(
                differences.primary.lastLogout / Constants.ms.second,
            );
            const logout = new MessageEmbed({
                color: Constants.colors.off,
            })
            .setDescription(replace(locale.logout.description, {
                discordID: userAPIData.discordID,
                unixEpoch: unixEpoch,
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
