import { type users as User } from '@prisma/client';
import { type CleanHypixelData } from '../@types/Hypixel';
import { Base } from '../structures/Base';

export class Data extends Base {
    public async update(user: User, newData: CleanHypixelData) {
        // https://github.com/prisma/prisma/issues/5042
        const oldData = await this.container.database.activities.findFirst({
            where: {
                uuid: {
                    equals: user.uuid,
                },
            },
        }) as CleanHypixelData;

        const changes = this.changes(newData, oldData);

        if (Object.keys(changes.new).length > 0) {
            await this.container.database.activities.create({
                data: {
                    uuid: user.uuid,
                    timestamp: Date.now(),
                    ...newData,
                },
            });
        }
    }

    private changes(newData: CleanHypixelData, oldData: CleanHypixelData) {
        type DataChanges = { [key: string]: string | number | null };
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