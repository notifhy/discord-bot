import { type users as User } from '@prisma/client';
import { type CleanHypixelData } from '../@types/Hypixel';
import { Base } from './Base';
import { type Changes } from '../core/Data';
import { locales } from '../locales/locales';

export abstract class Module extends Base {
    public readonly name: string;

    public readonly locale: keyof typeof locales[keyof typeof locales];

    constructor({
        name,
        locale,
    }: {
        name: string,
        locale: keyof typeof locales[keyof typeof locales],
    }) {
        super();

        this.name = name;
        this.locale = locale;
    }

    public abstract execute(user: User, newData: CleanHypixelData, changes: Changes): Promise<void>;
}