import { AssetModule } from './modules';

export interface Locale {
  [index: string]: Locale | AssetModule | string;
}

export interface Locales {
  [index: string]: Locale;
}

export interface Parameters {
  [index: string]: string | number;
}