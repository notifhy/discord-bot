import type { Differences } from '../../@types/modules';
import type {
    CleanHypixelPlayer,
    CleanHypixelStatus,
} from '../../@types/hypixel';
import type {
    History,
    UserAPIData,
} from '../../@types/database';
import { Client, Snowflake } from 'discord.js';
import { compare } from '../../util/utility';
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
            differences,
            userAPIData,
        };
    }

    async execute(
        {
            differences,
            userAPIData,
        }:
        {
            differences: Differences,
            userAPIData: UserAPIData,
        },
    ) {
        const promises: Promise<void>[] = [];

        for (const module of userAPIData.modules) {
            promises.push(
                this.client.modules
                    .get(module)!
                    .execute({
                        client: this.client,
                        differences: differences,
                        userAPIData: userAPIData,
                    }),
            );
        }

        await Promise.all(promises);
    }
}