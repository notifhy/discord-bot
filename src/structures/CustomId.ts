import type { CustomIdType } from '../enums/CustomIdType';

export interface CustomId {
    type: CustomIdType;
    [key: string]: string | undefined;
}

export class CustomId {
    public static create(customId: CustomId) {
        return JSON.stringify(customId);
    }

    public static parse(customId: string) {
        return JSON.parse(customId) as CustomId;
    }
}
