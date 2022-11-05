import type { users as User } from '@prisma/client';
import type { CleanHypixelData } from '../@types/Hypixel';
import { Base } from '../structures/Base';

type DataChanges = Partial<CleanHypixelData>;

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

        this.container.logger.debug(
            `${this.constructor.name}:`,
            'Parsed data:',
            changes,
        );

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
        const newDataChanges: DataChanges = {};
        const oldDataChanges: DataChanges = {};

        const combined = { ...newData, ...oldData };

        Object.keys(combined).forEach((rawKey) => {
            const key = rawKey as keyof CleanHypixelData;
            const newValue = newData[key];
            const oldValue = oldData[key];

            if (newValue !== oldValue) {
                // Typescript cannot understand that the same key will yield the same type
                // This seems to be the alternative to get good typings on the output

                // @ts-ignore
                newDataChanges[key] = newValue;
                // @ts-ignore
                oldDataChanges[key] = oldValue;
            }
        });

        return {
            new: newDataChanges,
            old: oldDataChanges,
        };
    }
}
