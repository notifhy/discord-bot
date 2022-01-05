import type {
    CleanHypixelPlayer,
    CleanHypixelStatus,
} from '../@types/hypixel';
import type { Differences } from '../@types/modules';
import type {
    History,
    UserAPIData,
} from '../@types/database';
import { compare } from '../util/utility';
import { SQLite } from '../util/SQLite';
import Constants from '../util/errors/Constants';

export class ModuleData {
    readonly currentUserAPIData: UserAPIData;
    readonly now: number;
    readonly differences: Differences;
    readonly userAPIData: UserAPIData;

    constructor(
        currentUserAPIData: UserAPIData,
        {
            cleanHypixelPlayer,
            cleanHypixelStatus,
        }: {
            cleanHypixelPlayer: CleanHypixelPlayer;
            cleanHypixelStatus?: CleanHypixelStatus;
        },
    ) {
        const hypixelData = Object.assign(
            cleanHypixelPlayer,
            cleanHypixelStatus,
        );

        this.currentUserAPIData = currentUserAPIData;
        this.now = Date.now();
        this.differences = compare(hypixelData, this.currentUserAPIData);
        this.userAPIData = Object.assign(
            this.currentUserAPIData,
            this.differences.primary,
            { lastUpdated: this.now },
        );
    }

    async updateUserAPIData() {
        const userAPIDataUpdate: Partial<UserAPIData> = {
            lastUpdated: this.now,
            ...this.differences.primary,
        };

        if (Object.keys(this.differences.primary).length > 0) {
            const historyUpdate: History = {
                date: this.now,
                ...this.differences.primary,
            };

            const { history } = this.currentUserAPIData;

            history.unshift(historyUpdate);
            history.splice(Constants.limits.userAPIDataHistory);
            Object.assign(userAPIDataUpdate, { history: history });
        }

        await SQLite.updateUser({
            discordID: this.currentUserAPIData.discordID,
            table: Constants.tables.api,
            data: userAPIDataUpdate,
        });
    }
}
