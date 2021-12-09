import type { CleanHypixelPlayer, CleanHypixelStatus } from '../@types/hypixel';
import type { Differences } from '../@types/modules';
import type { History, RawUserAPIData, UserAPIData } from '../@types/database';
import { compare } from '../util/utility';
import { SQLiteWrapper } from '../database';

export class HypixelModuleDataManager {
    oldUserAPIData: UserAPIData;
    now: number;
    differences: Differences;
    newUserAPIData: UserAPIData;

    constructor({
        oldUserAPIData,
        cleanHypixelPlayer,
        cleanHypixelStatusData,
    }: {
        oldUserAPIData: UserAPIData;
        cleanHypixelPlayer: CleanHypixelPlayer;
        cleanHypixelStatusData: CleanHypixelStatus | undefined;
    }) {
        const hypixelData = Object.assign(
            cleanHypixelPlayer,
            cleanHypixelStatusData,
        );

        this.oldUserAPIData = oldUserAPIData;
        this.now = Date.now();
        this.differences = compare(hypixelData, this.oldUserAPIData);
        this.newUserAPIData = Object.assign(
            this.oldUserAPIData,
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
            const { history }: { history: History[] } = this.oldUserAPIData;
            history.unshift(historyUpdate);
            history.splice(250);
            Object.assign(userAPIDataUpdate, { history: history });
        }

        await SQLiteWrapper.updateUser<Partial<UserAPIData>, RawUserAPIData>({
            discordID: this.oldUserAPIData.discordID,
            table: 'api',
            data: userAPIDataUpdate,
        });
    }
}
