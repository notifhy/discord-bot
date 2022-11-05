import type { users as User } from '@prisma/client';
import type { CleanHypixelData } from '../@types/Hypixel';
import { Base } from '../structures/Base';

type DataChanges = { [key: string]: bigint | null | number | string };

export type Changes = {
    new: DataChanges;
    old: DataChanges;
};

export class Data extends Base {
    public async parse(user: User, newData: CleanHypixelData) {
        // https://github.com/prisma/prisma/issues/5042
        const oldData = (await this.container.database.activities.findFirst({
            orderBy: {
                index: 'desc',
            },
            select: {
                firstLogin: true,
                lastLogin: true,
                lastLogout: true,
                version: true,
                language: true,
                gameType: true,
                gameMode: true,
                gameMap: true,
                lastClaimedReward: true,
                rewardScore: true,
                rewardHighScore: true,
                totalDailyRewards: true,
                totalRewards: true,
            },
            where: {
                id: {
                    equals: user.id,
                },
            },
        }) ?? {}) as CleanHypixelData;

        const changes = this.changes(newData, oldData);

        console.log(changes);

        if (Object.keys(changes.new).length > 0) {
            await this.container.database.activities.create({
                data: {
                    id: user.id,
                    timestamp: Date.now(),
                    ...newData,
                },
            });
        }

        return changes;
    }

    private changes(newData: CleanHypixelData, oldData: CleanHypixelData) {
        const newDataChanges: DataChanges = {} as Partial<CleanHypixelData>;
        const oldDataChanges: DataChanges = {} as Partial<CleanHypixelData>;

        const combined = { ...newData, ...oldData };

        Object.keys(combined).forEach((key) => {
            const newValue = newData[key as keyof typeof newData];
            const oldValue = oldData[key as keyof typeof oldData];

            if (newValue !== oldValue) {
                newDataChanges[key] = newValue;
                oldDataChanges[key] = oldValue;
            }
        });

        return {
            new: newDataChanges,
            old: oldDataChanges,
        };
    }
}
