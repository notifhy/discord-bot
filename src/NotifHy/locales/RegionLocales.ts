import type {
    Locale,
    Locales,
    Parameters,
} from '../@types/locales';
import { Constants } from '../utility/Constants';
import en from './en-US.json';

export const locales: Locales = {
    'en-US': en,
};

export class RegionLocales {
    static locale(locale?: string | null): Locale {
        let locale2 = locale ?? Constants.defaults.language;

        if (!Object.keys(locales).includes(locale2)) {
            locale2 = Constants.defaults.language;
        }

        return locales[locale2 as keyof Locales];
    }

    static replace(input: string, parameters?: Parameters): string {
        let replaced: string = input;

        for (const parameter in parameters) {
            //@ts-expect-error hasOwn not implemented in typings.
            if (Object.hasOwn(parameters, parameter)) {
                const regex = new RegExp(`{{ ${parameter} }}`, 'g');
                replaced = replaced.replaceAll(
                    regex,
                    String(parameters[parameter]),
                );
            }
        }

        return replaced;
    }
}