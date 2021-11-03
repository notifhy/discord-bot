import type { Locale, Locales, Parameters } from '../src/@types/locales';
import * as fs from 'fs/promises';

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

  // eslint-disable-next-line id-length
  localizer(path: string, local: string | undefined, parameters?: Parameters) {
    const pathArray: string[] = path.split('.');
    let fetchedString: Locales | Locale | string = this.locales;
    fetchedString = fetchedString[local ?? 'en-us' as keyof Locales];
    for (const pathCommand of pathArray) {
      if (typeof fetchedString === 'string') break;
      fetchedString = fetchedString[pathCommand as keyof Locale];
    }

    for (const parameter in parameters) {
      if (Object.prototype.hasOwnProperty.call(parameters, parameter)) {
        const regex: RegExp = new RegExp(`%{${parameter}}%`);
        fetchedString = (fetchedString as string).replace(regex, String(parameters[parameter])); //eslint-disable-line no-extra-parens
      }
    }
    return fetchedString as string;
  }
}