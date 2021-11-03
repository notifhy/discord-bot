export interface Locale {
  [index: string]: Locale | string;
}

export interface Locales {
  [index: string]: Locale;
}

export interface Parameters {
  [index: string]: string | number;
}