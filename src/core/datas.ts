import type { Snowflake } from 'discord.js';
import type {
    CleanHypixelPlayer,
    CleanHypixelStatus,
} from '../@types/hypixel';
import type {
    History,
    UserAPIData,
} from '../@types/database';
import { Constants } from '../utility/Constants';
import { SQLite } from '../utility/SQLite';
import { compare } from '../utility/utility';

export class Data {
    public static process(
        discordID: Snowflake,
        {
            player,
            status,
        }: {
            player: CleanHypixelPlayer,
            status: CleanHypixelStatus | undefined,
        },
    ) {
        const userAPIData = SQLite.getUser<UserAPIData>({
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

        SQLite.updateUser<UserAPIData>({
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
}