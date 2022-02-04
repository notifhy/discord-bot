import type { ModuleDifferences } from '../../@types/modules';
import type {
    CleanHypixelPlayer,
    CleanHypixelStatus,
} from '../../@types/hypixel';
import type {
    Client,
    Snowflake,
} from 'discord.js';
import type {
    History,
    UserAPIData,
    UserData,
} from '../../@types/database';
import {
    BetterEmbed,
    compare,
} from '../../util/utility';
import { RegionLocales } from '../../../locales/RegionLocales';
import { SQLite } from '../../util/SQLite';
import Constants from '../../util/Constants';

export class ModuleManager {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    static async process(
        discordID: Snowflake,
        {
            player,
            status,
        }: {
            player: CleanHypixelPlayer,
            status: CleanHypixelStatus | undefined,
        },
    ) {
        const userAPIData =
            await SQLite.getUser<UserAPIData>({
                discordID: discordID,
                table: Constants.tables.api,
                allowUndefined: false,
                columns: ['*'],
            });

        const { history } = userAPIData;
        const now = Date.now();
        const hypixelData = { ...player, ...status };
        const differences = compare(hypixelData, userAPIData);
        const userAPIDataUpdate = { ...differences.primary, lastUpdated: now };

        if (Object.keys(differences.primary).length > 0) {
            const historyUpdate: History = {
                date: now,
                ...differences.primary,
            };

            history.unshift(historyUpdate);
            history.splice(Constants.limits.userAPIDataHistory);
            Object.assign(userAPIDataUpdate, { history: history });
        }

        Object.assign(userAPIData, userAPIDataUpdate);

        await SQLite.updateUser<UserAPIData>({
            discordID: discordID,
            table: Constants.tables.api,
            data: userAPIDataUpdate,
        });

        return {
            differences: {
                newData: differences.primary,
                oldData: differences.secondary,
            },
            userAPIData: userAPIData,
        };
    }

    async execute(
        {
            differences,
            userAPIData,
        }:
        {
            differences: ModuleDifferences,
            userAPIData: UserAPIData,
        },
    ) {
        const apiEnabled =
            userAPIData.lastLogin !== null &&
            userAPIData.lastLogout !== null;

        const userData = await SQLite.getUser<UserData>({
            discordID: userAPIData.discordID,
            table: Constants.tables.users,
            allowUndefined: false,
            columns: ['*'],
        });

        const locale =
            RegionLocales.locale(userData.locale).modules;

        const modules = this.client.modules.filter(module => (
            userAPIData.modules.includes(module.properties.name) &&
            (
                module.properties.onlineStatusAPI === true
                    ? module.properties.onlineStatusAPI && apiEnabled === true
                    : true
            )
        ));

        const promises: Promise<void>[] = [];

        for (const module of modules.values()) {
            promises.push(
                module
                    .execute({
                        client: this.client,
                        differences: differences,
                        baseLocale: locale,
                        userAPIData: userAPIData,
                        userData: userData,
                    }),
            );
        }

        await Promise.all(promises);

        let embed;

        if (ModuleManager.isMissingAPIData(differences)) {
            embed = new BetterEmbed({
                text: locale.statusAPIMissing.footer,
            })
                .setColor(Constants.colors.warning)
                .setTitle(locale.statusAPIMissing.title)
                .setDescription(locale.statusAPIMissing.description);
        } else if (ModuleManager.isReceivedAPIData(differences)) {
            embed = new BetterEmbed({
                text: locale.statusAPIReceived.footer,
            })
                .setColor(Constants.colors.on)
                .setTitle(locale.statusAPIReceived.title)
                .setDescription(locale.statusAPIReceived.description);
        }

        if (embed) {
            const user =
                await this.client.users.fetch(userAPIData.discordID);

            await user.send({ embeds: [embed] });
        }
    }

    static isMissingAPIData(differences: ModuleDifferences) {
        return (differences.oldData.lastLogin === null &&
            differences.oldData.lastLogin !== null) ||
        (differences.oldData.lastLogout === null &&
            differences.oldData.lastLogout !== null);
    }

    static isReceivedAPIData(differences: ModuleDifferences) {
        return (differences.oldData.lastLogin !== null &&
            differences.oldData.lastLogin === null) ||
        (differences.oldData.lastLogout !== null &&
            differences.oldData.lastLogout === null);
    }
}