import type { Locales, LocalesTree, Parameters } from '../src/@types/locales';
import * as en from './en-us.json';
import * as fr from './fr-FR.json';

const test = {
  'en-us': en,
  'fr-FR': fr,
};

const locales: unknown = {
  'en-us': en,
  'fr-FR': fr,
};

export class RegionLocales {
  localizer(path: string, locale?: string, parameters?: Parameters): string {
    const pathArray: string[] = path.split('.');
    let fetchedString: LocalesTree | string = (locales as Locales)[(locale ?? 'en-us') as keyof Locales];
    for (const pathCommand of pathArray) {
      if (typeof fetchedString === 'string') break;
      fetchedString = fetchedString?.[pathCommand as keyof LocalesTree] as LocalesTree | string;
    }

    if (typeof fetchedString !== 'string' || fetchedString === undefined) {
      throw new RangeError('Fetched string is not of type string');
    }

    for (const parameter in parameters) {
      if (Object.prototype.hasOwnProperty.call(parameters, parameter)) {
        const regex: RegExp = new RegExp(`%{${parameter}}%`);
        fetchedString = fetchedString?.replace(regex, String(parameters[parameter]));
      }
    }
    return fetchedString;
  }

  get(path: string, locale?: string) {
    const pathArray: string[] = path.split('.');
    let fetchedString: LocalesTree | string = (locales as Locales)[(locale ?? 'en-us') as keyof Locales];
    for (const pathCommand of pathArray) {
      if (typeof fetchedString === 'string') break;
      fetchedString = fetchedString?.[pathCommand as keyof LocalesTree] as LocalesTree | string;
    }

    return fetchedString;
  }
}