import type { Client } from 'discord.js';
import type { ModuleDifferences } from '../@types/modules';
import type {
    UserAPIData,
    UserData,
} from '../@types/database';
import { Constants } from '../utility/Constants';
import { RegionLocales } from '../locales/RegionLocales';
import { SQLite } from '../utility/SQLite';
import { BetterEmbed } from '../utility/utility';

export class CoreModule {
    client: Client;

    constructor(client: Client) {
        this.client = client;
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
        const apiEnabled = userAPIData.lastLogin !== null
            && userAPIData.lastLogout !== null;

        const userData = SQLite.getUser<UserData>({
            discordID: userAPIData.discordID,
            table: Constants.tables.users,
            allowUndefined: false,
            columns: ['*'],
        });

        const locale = RegionLocales.locale(
            userData.locale,
        ).modules;

        const modules = this.client.modules.filter((module) => (
            userAPIData.modules.includes(module.properties.name)
            && (
                module.properties.onlineStatusAPI === true
                    ? module.properties.onlineStatusAPI && apiEnabled === true
                    : true
            )
        ));

        // eslint-disable-next-line no-restricted-syntax
        for (const module of modules.values()) {
            // eslint-disable-next-line no-await-in-loop
            await module.execute({
                client: this.client,
                differences: differences,
                baseLocale: locale,
                userAPIData: userAPIData,
                userData: userData,
            });
        }

        let embed;

        if (CoreModule.missedAPIData(differences)) {
            embed = new BetterEmbed({
                text: locale.statusAPIMissing.footer,
            })
                .setColor(Constants.colors.warning)
                .setTitle(locale.statusAPIMissing.title)
                .setDescription(locale.statusAPIMissing.description);
        } else if (CoreModule.receivedAPIData(differences)) {
            embed = new BetterEmbed({
                text: locale.statusAPIReceived.footer,
            })
                .setColor(Constants.colors.on)
                .setTitle(locale.statusAPIReceived.title)
                .setDescription(locale.statusAPIReceived.description);
        }

        if (embed) {
            const user = await this.client.users.fetch(
                userAPIData.discordID,
            );

            await user.send({
                embeds: [embed],
            });
        }
    }

    static missedAPIData(differences: ModuleDifferences) {
        return (differences.oldData.lastLogin === null
            && differences.oldData.lastLogin !== null)
        || (differences.oldData.lastLogout === null
            && differences.oldData.lastLogout !== null);
    }

    static receivedAPIData(differences: ModuleDifferences) {
        return (differences.oldData.lastLogin !== null
            && differences.oldData.lastLogin === null)
        || (differences.oldData.lastLogout !== null
            && differences.oldData.lastLogout === null);
    }
}