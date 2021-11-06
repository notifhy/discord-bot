import type { Locale, Locales, Parameters } from '../src/@types/locales';
import * as fs from 'fs/promises';
import { AssetModule, AssetModules } from '../src/@types/modules';

export class RegionLocales {
  locales: Locales;
  constructor(locales: Locales) {
    this.locales = locales;
  }

  //ready must be called for the locales to load first
  static async ready() { //I gave up readability for a slight performance boost
    const localesFolder = (await fs.readdir(__dirname)).filter(file => file.endsWith('.json'));
    const localesPromises: Promise<Locale>[] = [];
    for (const localeFile of localesFolder) localesPromises.push(import(`${__dirname}/${localeFile}`));

    const locales: Locales = {};
    (await Promise.all(localesPromises)).forEach((locale, index) => {
      locales[localesFolder[index].replace('.json', '')] = locale;
    });

    return new RegionLocales(locales);
  }

  localizer(path: string, locale: string | undefined, parameters?: Parameters): string {
    const pathArray: string[] = path.split('.');
    let fetchedString: Locales | Locale | string = this.locales;
    fetchedString = fetchedString?.[locale ?? 'en-us' as keyof Locales] as Locale;
    for (const pathCommand of pathArray) {
      if (typeof fetchedString === 'string') break;
      fetchedString = fetchedString?.[pathCommand as keyof Locale] as Locale | string;
    }

    if (typeof fetchedString !== 'string' || fetchedString === undefined) {
      throw new RangeError('Fetched string is not of type string');
    }

    for (const parameter in parameters) {
      if (Object.prototype.hasOwnProperty.call(parameters, parameter)) {
        const regex: RegExp = new RegExp(`%{${parameter}}%`);
        fetchedString = fetchedString.replace(regex, String(parameters[parameter])); //eslint-disable-line no-extra-parens
      }
    }
    return fetchedString;
  }

  get(path: string, locale: string): AssetModule {
    const pathArray: string[] = path.split('.');
    let fetchedItem = this.locales[locale ?? 'en-us' as keyof Locales] as AssetModule;

    for (const pathCommand of pathArray) {
      if (typeof fetchedItem === 'string') break;
      fetchedItem = fetchedItem?.[pathCommand as keyof AssetModules] as unknown as AssetModule;
    }

    return fetchedItem;
  }
}