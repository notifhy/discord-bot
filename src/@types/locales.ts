import { AssetModule } from './modules';

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
}

export interface Ping {
  embed1: {
    title: string;
  }
  embed2: BaseEmbed;
}

export interface Commands {
  help: Help;
  modules: Modules;
  ping: Ping;
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
  | Constraints
  | Commands
  | Help
  | Modules
  | Ping

export interface Parameters {
  [index: string]: string | number;
}