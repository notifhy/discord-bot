import en_US from './en-US.json';

export const locales = {
    'en-US': en_US,
};

type Locale = typeof locales[keyof typeof locales];

export type MessageKeys = {
    [Property in keyof Locale as Locale[Property] extends { message: string }
        ? Property
        : never]: Locale[Property];
};

export type ListKeys = {
    [Property in keyof Locale as Locale[Property] extends { list: string[] }
        ? Property
        : never]: Locale[Property];
};
