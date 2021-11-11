import { AssetModule } from './modules';

/*
Misc. Interfaces
*/
export interface ModuleButton {
  [key: string]: string | boolean;
  label: string;
  id: string;
  style: string,
  invert: boolean;
}

export interface ModuleButtons {
  [key: string]: ModuleButton;
  enable: ModuleButton;
  disable: ModuleButton;
  settings: ModuleButton;
}

/*
General Interfaces
*/
export interface Field {
  name: string;
  value: string;
}

export interface BaseEmbed {
  title: string;
  description: string;
}

/*
General Interface
*/
export interface General {
  moduleHistories: string[];
}

/*
Constraint Interface
*/
export interface Constraints {
  blockedUsers: BaseEmbed;
  devMode: BaseEmbed;
  owner: BaseEmbed;
  dm: BaseEmbed;
  cooldown: {
    embed1: BaseEmbed;
    embed2: BaseEmbed;
  };
}

/*
Command Interface
*/
export interface Help {
  information: BaseEmbed;
  all: BaseEmbed & Field;
  specific: {
    invalid: BaseEmbed;
    title: string;
    description: string;
    usage: Field;
    cooldown: Field;
    dm: Field;
    owner: Field;
  }
}

export interface Language {
  alreadySet: BaseEmbed;
  title: string;
  description: string;
}

export interface Modules {
  title: string;
  description: string;
  moduleField: BaseEmbed;
  statusField: {
    name: string,
    added: string;
    removed: string;
  }
  modules: {
    defender: AssetModule;
    friend: AssetModule;
    daily: AssetModule;
  }
  buttons: ModuleButtons;
}

export interface Ping {
  embed1: {
    title: string;
  }
  embed2: BaseEmbed;
}

export interface Register {
  invalid: BaseEmbed;
  notFound: BaseEmbed;
  unlinked: BaseEmbed;
  mismatched: BaseEmbed;
  title: string;
  description: Field;
  field: Field;
}

export interface Commands {
  help: Help;
  language: Language;
  modules: Modules;
  ping: Ping;
  register: Register;
}

/*
Base
*/
export interface Locale {
  constraints: Constraints;
  commands: Commands;
}

export interface Locales {
  'en-us': Locale;
  'fr-FR': Locale;
}

export type LocalesTree = Locale
  | General
  | Constraints
  | Commands
  | Help
  | Language
  | Modules
  | Ping
  | Register

export interface Parameters {
  [index: string]: string | number;
}