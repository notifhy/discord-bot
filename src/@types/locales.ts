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
export interface Data {
  delete: {
    confirm: BaseEmbed;
    deleted: BaseEmbed;
    aborted: BaseEmbed;
    yesButton: string;
    noButton: string;
  }
}

export interface Help {
  information: BaseEmbed;
  all: {
    field: Field
  } & BaseEmbed
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
  defender: {
    title: string;
    description: string;
    menuPlaceholder: string;
    menu: {
      toggle: {
        enableButton: string;
        disableButton: string;
      } & AssetModule;
    }
  };
  friend: {
    title: string;
    description: string;
    menuPlaceholder: string;
    menu: {
      toggle: {
        enableButton: string;
        disableButton: string;
      } & AssetModule;
      channel: AssetModule;
    }
  };
  rewards: {
    title: string;
    description: string;
    menuPlaceholder: string;
    menu: {
      toggle: {
        enableButton: string;
        disableButton: string;
      } & AssetModule;
      grace: AssetModule;
    }
  };
  title: string;
  description: string;
  moduleField: Field;
  menuPlaceholder: string;
  statusField: {
    name: string,
    added: string;
    removed: string;
  }
  modules: {
    defender: AssetModule;
    friend: AssetModule;
    rewards: AssetModule;
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
  description: string;
  field: Field;
}

export interface Commands {
  data: Data;
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

export type LocaleTree =
  | Locale
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