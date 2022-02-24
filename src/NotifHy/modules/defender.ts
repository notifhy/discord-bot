import type { ClientModule } from '../@types/modules';
import type {
    DefenderModule,
    UserAPIData,
    UserData,
} from '../@types/database';
import {
    arrayRemove,
    BetterEmbed,
    cleanGameType,
    timestamp,
} from '../../utility/utility';
import {
    ColorResolvable,
    EmbedFieldData,
    Formatters,
    TextChannel,
} from 'discord.js';
import { Constants } from '../utility/Constants';
import { GlobalConstants } from '../../utility/Constants';
import { Log } from '../../utility/Log';
import { ModuleError } from '../errors/ModuleError';
import { RegionLocales } from '../locales/RegionLocales';
import { SQLite } from '../utility/SQLite';

export const properties: ClientModule['properties'] = {
    name: 'defender',
    cleanName: 'Defender Module',
    onlineStatusAPI: true,
};

export const execute: ClientModule['execute'] = async ({
    client,
    baseLocale,
    differences: { newData, oldData },
    userAPIData,
    userData,
}): Promise<void> => {
    try {
        if (Object.keys(newData).length === 0) { //A bit more future proof
            return;
        }

        const defenderModule = SQLite.getUser<DefenderModule>({
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

        const locale = baseLocale.defender;
        const { replace } = RegionLocales;

        const fields: EmbedFieldData[] = [];
        let color: ColorResolvable = Constants.colors.normal;

        if (
            newData.lastLogin != null && //eslint-disable-line eqeqeq
            oldData.lastLogin != null && //eslint-disable-line eqeqeq
            defenderModule.alerts.login === true &&
            newData.lastLogin + (GlobalConstants.ms.minute * 2.5) > Date.now()
        ) {
            const relative = timestamp(newData.lastLogin, 'R');
            const time = timestamp(newData.lastLogin, 'T');

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
            newData.lastLogout != null && //eslint-disable-line eqeqeq
            oldData.lastLogout != null && //eslint-disable-line eqeqeq
            defenderModule.alerts.logout === true &&
            newData.lastLogout + (GlobalConstants.ms.minute * 2.5) > Date.now()
        ) {
            //lastLogout seems to change twice sometimes on a single logout, this is a fix for that
            const lastEvent = userAPIData.history[1] ?? {}; //First item in array is this event, so it checks the second item
            //@ts-expect-error hasOwn typing not implemented yet - https://github.com/microsoft/TypeScript/issues/44253
            const duplicationCheck = Object.hasOwn(lastEvent, 'lastLogout') &&
                newData.lastLogout - lastEvent.lastLogout! <
                GlobalConstants.ms.second * 2.5;

            if (duplicationCheck === false) {
                const relative = timestamp(newData.lastLogout, 'R');
                const time = timestamp(newData.lastLogout, 'T');

                const logout = {
                    name: locale.logout.name,
                    value: replace(locale.logout.value, {
                        relative: relative!,
                        time: time!,
                    }),
                };

                if (
                    newData.lastLogout >
                    (newData.lastLogin ?? 0)
                ) {
                    fields.unshift(logout);
                    color = Constants.colors.off;
                } else {
                    fields.push(logout);
                    color = Constants.colors.on;
                }
            }
        }

        const cleanVersion = newData.version?.match(/^1.\d+/m)?.[0];

        if (
            newData.version != null && //eslint-disable-line eqeqeq
            oldData.version != null && //eslint-disable-line eqeqeq
            defenderModule.alerts.version === true &&
            cleanVersion &&
            defenderModule.versions.includes(cleanVersion) === false
        ) {
            const version = {
                name: locale.version.name,
                value: replace(locale.version.value, {
                    sVersion: oldData.version,
                    pVersion: newData.version,
                }),
            };

            fields.push(version);
            color = Constants.colors.ok;
        }

        if (
            defenderModule.alerts.gameType === true &&
            (
                (
                    newData.gameType &&
                    defenderModule.gameTypes
                        .includes(newData.gameType)
                ) ||
                (
                    oldData.gameType &&
                    defenderModule.gameTypes
                        .includes(oldData.gameType)
                )
            )
        ) {
            const gameType = {
                name: locale.gameType.name,
                value: replace(locale.gameType.value, {
                    sGameType:
                        cleanGameType(oldData.gameType ?? null) ??
                            locale.gameType.null,
                    pGameType:
                        cleanGameType(newData.gameType ?? null) ??
                            locale.gameType.null,
                }),
            };

            fields.push(gameType);

            color = Constants.colors.warning;
        }

        if (
            newData.language != null && //eslint-disable-line eqeqeq
            oldData.language != null && //eslint-disable-line eqeqeq
            defenderModule.alerts.language === true &&
            defenderModule.languages
                .includes(newData.language) === false
        ) {
            const language = {
                name: locale.language.name,
                value: replace(locale.language.value, {
                    sLanguage: oldData.language,
                    pLanguage: newData.language,
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
                Log.module(properties.name, userData, `Missing ${missingPermissions.join(', ')}`);

                const newModules = arrayRemove(
                    userAPIData.modules,
                    'defender',
                );

                SQLite.updateUser<UserAPIData>({
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

                SQLite.updateUser<UserData>({
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

        Log.module(properties.name, userData, 'Delivered alerts');
    } catch (error) {
        throw new ModuleError({
            error: error,
            cleanModule: properties.cleanName,
            module: properties.name,
        });
    }
};