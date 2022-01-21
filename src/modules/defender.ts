import type { ClientModule } from '../@types/modules';
import type { DefenderModule, UserAPIData, UserData } from '../@types/database';
import { arrayRemove, BetterEmbed, cleanGameType, timestamp } from '../util/utility';
import { ColorResolvable, EmbedFieldData, Formatters, TextChannel } from 'discord.js';
import { Log } from '../util/Log';
import { RegionLocales } from '../../locales/RegionLocales';
import { SQLite } from '../util/SQLite';
import Constants from '../util/Constants';
import ModuleError from '../util/errors/ModuleError';

export const properties: ClientModule['properties'] = {
    name: 'defender',
    cleanName: 'Defender',
};

export const execute: ClientModule['execute'] = async ({
    client,
    differences: { primary, secondary },
    userAPIData,
}): Promise<void> => {
    try {
        if (Object.keys(primary).length === 0) { //A bit more future proof
            return;
        }

        const defenderModule =
            await SQLite.getUser<DefenderModule>({
                discordID: userAPIData.discordID,
                table: Constants.tables.defender,
                allowUndefined: false,
                columns: [
                    'alerts',
                    'channel',
                    'gameTypes',
                    'languages',
                    'versions',
                ],
            });

        const userData =
            await SQLite.getUser<UserData>({
                discordID: userAPIData.discordID,
                table: Constants.tables.users,
                allowUndefined: false,
                columns: [
                    'locale',
                    'systemMessages',
                ],
            });

        const locale = RegionLocales.locale(userData.locale).modules.defender;
        const { replace } = RegionLocales;

        const fields: EmbedFieldData[] = [];
        let color: ColorResolvable = Constants.colors.normal;

        if (
            primary.lastLogin &&
            secondary.lastLogin &&
            defenderModule.alerts.login === true
        ) {
            const relative = timestamp(primary.lastLogin, 'R');
            const time = timestamp(primary.lastLogin, 'T');

            const login = {
                name: locale.login.name,
                value: replace(locale.login.value, {
                    relative: relative!,
                    time: time!,
                }),
            };

            fields.push(login);

            color = Constants.colors.on;
        }

        if (
            primary.lastLogout &&
            secondary.lastLogout &&
            defenderModule.alerts.logout === true
        ) {
            //lastLogout seems to change twice sometimes on a single logout, this is a fix for that
            const lastEvent = userAPIData.history[1]; //First item in array is this event, so it checks the second item
            //@ts-expect-error hasOwn typing not implemented yet - https://github.com/microsoft/TypeScript/issues/44253
            const duplicationCheck = Object.hasOwn(lastEvent, 'lastLogout') &&
                primary.lastLogout - lastEvent.lastLogout! <
                Constants.ms.second * 2.5;

            if (duplicationCheck === false) {
                const relative = timestamp(primary.lastLogout, 'R');
                const time = timestamp(primary.lastLogout, 'T');

                const logout = {
                    name: locale.logout.name,
                    value: replace(locale.logout.value, {
                        relative: relative!,
                        time: time!,
                    }),
                };

                if (
                    primary.lastLogout >
                    (primary.lastLogin ?? 0)
                ) {
                    fields.unshift(logout);
                    color = Constants.colors.off;
                } else {
                    fields.push(logout);
                    color = Constants.colors.on;
                }
            }
        }

        const cleanVersion = primary.version?.match(/^1.\d+/m)?.[0];

        if (
            primary.version &&
            secondary.version &&
            defenderModule.alerts.version === true &&
            cleanVersion &&
            defenderModule.versions.includes(cleanVersion) === false
        ) {
            const version = {
                name: locale.version.name,
                value: replace(locale.version.value, {
                    sVersion: secondary.version,
                    pVersion: primary.version,
                }),
            };

            fields.push(version);
            color = Constants.colors.ok;
        }

        if (
            defenderModule.alerts.gameType === true &&
            (
                (
                    primary.gameType &&
                    defenderModule.gameTypes
                        .includes(primary.gameType)
                ) ||
                (
                    secondary.gameType &&
                    defenderModule.gameTypes
                        .includes(secondary.gameType)
                )
            )
        ) {
            const language = {
                name: locale.gameType.name,
                value: replace(locale.gameType.value, {
                    sGameType:
                        cleanGameType(secondary.gameType ?? null) ??
                            locale.gameType.null,
                    pGameType:
                        cleanGameType(primary.gameType ?? null) ??
                            locale.gameType.null,
                }),
            };

            fields.push(language);

            color = Constants.colors.warning;
        }

        if (
            primary.language &&
            secondary.language &&
            defenderModule.alerts.language === true &&
            defenderModule.languages
                .includes(primary.language) === false
        ) {
            const language = {
                name: locale.language.name,
                value: replace(locale.language.value, {
                    sLanguage: secondary.language,
                    pLanguage: primary.language,
                }),
            };

            fields.push(language);
            color = Constants.colors.warning;
        }

        if (fields.length === 0) {
            return;
        }

        const address = defenderModule.channel
            ? await client.channels.fetch(defenderModule.channel) as TextChannel
            : await client.users.fetch(userAPIData.discordID);

        if (address instanceof TextChannel) {
            const me = await address.guild.members.fetch(client.user!.id);

            const missingPermissions = address
                .permissionsFor(me)
                .missing(Constants.modules.friends.permissions);

            if (missingPermissions.length > 0) {
                Log.error(userAPIData.discordID, `Defender Module: Missing ${missingPermissions.join(', ')}`);

                const newModules =
                    arrayRemove(userAPIData.modules, 'defender');

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
                        channel: Formatters
                            .channelMention(defenderModule.channel!),
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
        }

        const alertEmbed = new BetterEmbed({ text: locale.embed.footer })
            .setColor(color)
            .setTitle(locale.embed.title)
            .addFields(fields.reverse());

        await address.send({
            content:
                address instanceof TextChannel
                    ? Formatters.userMention(userAPIData.discordID)
                    : undefined,
            embeds: [alertEmbed],
            allowedMentions: {
                parse: ['users'],
            },
        });
    } catch (error) {
        throw new ModuleError({
            error: error,
            cleanModule: properties.cleanName,
            module: properties.name,
        });
    }
};