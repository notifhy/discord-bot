import { type Client } from 'discord.js';
import { type ModuleDifferences } from '../@types/modules';
import {
    type UserAPIData,
    type UserData,
} from '../@types/database';
import { RegionLocales } from '../locales/RegionLocales';
import { Constants } from '../utility/Constants';
import { SQLite } from '../utility/SQLite';
import { BetterEmbed } from '../utility/utility';

export class Module {
    public readonly client: Client;

    public constructor(client: Client) {
        this.client = client;
    }

    public async execute(
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

        if (Module.missedAPIData(differences)) {
            embed = new BetterEmbed({
                text: locale.statusAPIMissing.footer,
            })
                .setColor(Constants.colors.warning)
                .setTitle(locale.statusAPIMissing.title)
                .setDescription(locale.statusAPIMissing.description);
        } else if (Module.receivedAPIData(differences)) {
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

    private static missedAPIData(differences: ModuleDifferences) {
        return (differences.oldData.lastLogin === null
            && differences.oldData.lastLogin !== null)
        || (differences.oldData.lastLogout === null
            && differences.oldData.lastLogout !== null);
    }

    private static receivedAPIData(differences: ModuleDifferences) {
        return (differences.oldData.lastLogin !== null
            && differences.oldData.lastLogin === null)
        || (differences.oldData.lastLogout !== null
            && differences.oldData.lastLogout === null);
    }
}