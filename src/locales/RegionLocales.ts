import {
    type Locale,
    type Locales,
    type Parameters,
} from '../@types/locales';
import { Constants } from '../utility/Constants';
import en from './en-US.json';

export const locales: Locales = {
    'en-US': en,
};

export class RegionLocales {
    public static locale(locale?: string | null): Locale {
        let locale2 = locale ?? Constants.defaults.language;

        if (!Object.keys(locales).includes(locale2)) {
            locale2 = Constants.defaults.language;
        }

        return locales[locale2 as keyof Locales];
    }

    public static replace(input: string, parameters?: Parameters): string {
        let replaced: string = input;

        // eslint-disable-next-line no-restricted-syntax
        for (const parameter in parameters) {
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