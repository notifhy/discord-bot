import type {
    Locale,
    Locales,
    Parameters,
} from '../src/@types/locales';
import en from './en-US.json';
import fr from './fr.json';

export const locales: Locales = {
    'en-US': en,
    fr: fr,
};

export class RegionLocales {
    static locale(locale?: string | null): Locale {
        let locale2 = locale;
        if (!Object.keys(locales).includes(locale ?? 'en-US')) {
            locale2 = 'en-US';
        }

        return locales[locale2 as keyof Locales];
    }

    static replace(input: string, parameters?: Parameters): string {
        let replaced: string = input;

        for (const parameter in parameters) {
            //@ts-expect-error hasOwn not implemented in typings.
            if (Object.hasOwn(parameters, parameter)) {
                const regex = new RegExp(`%{${parameter}}%`, 'g');
                replaced = replaced.replaceAll(
                    regex,
                    String(parameters[parameter]),
                );
            }
        }

        return replaced;
    }
}
