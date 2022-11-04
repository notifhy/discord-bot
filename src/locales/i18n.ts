import type { Command } from '@sapphire/framework';
import { ListKeys, locales, MessageKeys } from './locales';
import { Options } from '../utility/Options';

// Simple implementation of Chrome's/Firefox's i18n
// eslint-disable-next-line @typescript-eslint/naming-convention
export class i18n {
    private locale: typeof locales[keyof typeof locales];

    private localeName: string;

    public constructor(locale?: string) {
        this.localeName = locale
        && locales[locale as keyof typeof locales]
            ? locale
            : Options.defaultLocale;

        this.locale = locales[this.localeName as keyof typeof locales];

        // Bindings
        this.getMessage = this.getMessage.bind(this);
    }

    public getLocale() {
        return this.localeName;
    }

    public getChatInputName(command: Command) {
        const structure = command.chatInputStructure;

        return (
            structure.nameLocalizations?.[
                this.localeName as keyof typeof structure.nameLocalizations
            ] ?? structure.name
        );
    }

    public getChatInputDescription(command: Command) {
        const structure = command.chatInputStructure;

        return (
            structure.descriptionLocalizations?.[
                this.localeName as keyof typeof structure.descriptionLocalizations
            ] ?? structure.description
        );
    }

    public getList(string: keyof ListKeys, options?: (string | number | bigint)[]) {
        const list = (this.locale[string] as { list?: string[] })?.list ?? ['null'];

        if (typeof options !== 'undefined') {
            let index = options.length;

            options.reverse().forEach((option) => {
                list.forEach((_item, itemIndex) => {
                    list[itemIndex] = list[itemIndex]!.replaceAll(`$${index}`, String(option));
                });
                index -= 1;
            });
        }

        return list;
    }

    public getMessage(string: keyof MessageKeys, options?: (string | number | bigint)[]) {
        let message = (this.locale[string] as { message?: string })?.message ?? 'null';

        if (message && typeof options !== 'undefined') {
            let index = options.length;

            options.reverse().forEach((option) => {
                message = message.replaceAll(`$${index}`, String(option));
                index -= 1;
            });
        }

        return message;
    }

    public setLocale(locale: string) {
        this.localeName = locale
        && locales[locale as keyof typeof locales]
            ? locale
            : Options.defaultLocale;

        this.locale = locales[this.localeName as keyof typeof locales];
    }
}
