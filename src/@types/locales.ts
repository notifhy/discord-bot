import type { MessageSelectMenuOptions } from 'discord.js';
import { Button } from '../util/ToggleButtons';

/*
Misc. Interfaces
*/
export interface ModuleButton { //unused?????
    [key: string]: string | boolean;
    label: string;
    id: string;
    style: string;
    invert: boolean;
}

export interface ModuleButtons { //same here?
    [key: string]: ModuleButton;
    enable: ModuleButton;
    disable: ModuleButton;
    settings: ModuleButton;
}

/*
General Interfaces
*/
export interface BaseEmbed {
    title: string;
    description: string;
}

export interface Field {
    name: string;
    value: string;
}

export interface ModuleData {
    label: string;
    description: string;
    longDescription: string;
}

export interface ModuleButton extends Omit<Button, 'enableCustomID' | 'disableCustomID'> {}

export interface ModuleSelect extends Omit<MessageSelectMenuOptions, 'customId' | 'minValues' | 'maxValues' | 'disabled' | 'options'> {
    options: {
        label: string;
        description: string;
    }[];
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
    };
    history: {
        embed: BaseEmbed;
        null: string;
    };
}

export interface Help {
    information: BaseEmbed;
    all: {
        field: Field;
    } & BaseEmbed;
    specific: {
        invalid: BaseEmbed;
        title: string;
        description: string;
        usage: Field;
        cooldown: Field;
        dm: Field;
        owner: Field;
    };
}

export interface Language {
    alreadySet: BaseEmbed;
    title: string;
    description: string;
}

export interface ModulesCommand {
    defender: {
        title: string;
        description: string;
        menuPlaceholder: string;
        missingConfigField: {
            name: string;
            value: string;
        };
        menu: {
            toggle: {
                button: ModuleButton;
            } & ModuleData;
        };
    };
    friends: {
        title: string;
        description: string;
        menuPlaceholder: string;
        missingConfigField: {
            name: string;
            value: string;
        };
        menu: {
            toggle: {
                button: ModuleButton;
            } & ModuleData;
            channel: {
                select: ModuleSelect
            } & ModuleData;
        };
    };
    rewards: {
        title: string;
        description: string;
        menuPlaceholder: string;
        missingConfigField: {
            name: string;
            value: string;
        };
        menu: {
            toggle: {
                button: {
                    enable: string;
                    disable: string;
                    enableCustomID: string;
                    disableCustomID: string;
                }
            } & ModuleData;
            alertTime: {
                select: ModuleSelect
            } & ModuleData;
            claimNotification: {
                button: ModuleButton;
            } & ModuleData;
            notificationInterval: {
                select: ModuleSelect
            } & ModuleData;
            milestones: {
                button: ModuleButton;
            } & ModuleData;
        };
    };
}

export interface Ping {
    embed1: {
        title: string;
    };
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

export interface System {
    embed: {
        title: string;
        field1: Field;
        field2: Field;
        field3: Field;
        field4: Field;
        field5: Field;
        field6: Field;
    }
}

export interface Commands {
    data: Data;
    help: Help;
    language: Language;
    modules: ModulesCommand;
    ping: Ping;
    register: Register;
    system: System;
}

/*
Errors
*/
export interface CommandErrors {
    embed: {
        field: Field
    } & BaseEmbed
}

export interface ConstraintErrors {
    blockedUsers: BaseEmbed;
    devMode: BaseEmbed;
    owner: BaseEmbed;
    dm: BaseEmbed;
    cooldown: {
        embed1: BaseEmbed;
        embed2: BaseEmbed;
    };
}

export interface ModuleErrors {
    10003: Field,
    10013: Field,
    50001: Field,
    50007: Field,
}

export interface SystemMessages {
    embed: {
        footer: string;
    } & BaseEmbed,
    failedDM: string,
}

export interface Errors {
    commandErrors: CommandErrors;
    constraintErrors: ConstraintErrors;
    moduleErrors: ModuleErrors;
    systemMessages: SystemMessages;
}

/*
Modules
*/
export interface Friends {
    missingData: {
        footer: string;
    } & BaseEmbed;
    receivedData: {
        footer: string;
    } & BaseEmbed;
    missingPermissions: Field;
    suppressNext: {
        footer: string;
    } & BaseEmbed;
    login: {
        description: string;
    };
    logout: {
        description: string;
    };
}

export interface Rewards {
    claimedNotification: {
        footer: string;
    } & BaseEmbed;
    milestone: {
        footer: string;
    } & BaseEmbed;
    rewardReminder: {
        title: string;
        footer: string;
        description: string[];
    };
}

export interface Modules {
    friends: Friends;
    rewards: Rewards;
}

/*
Base
*/
export interface Locale {
    errors: Errors;
    commands: Commands;
    modules: Modules;
}

export interface Locales {
    'en-us': Locale;
    'fr-FR': Locale;
}

export type LocaleTree =
    | Locale
    | Commands
    | Help
    | Language
    | ModulesCommand
    | Ping
    | Register
    | System
    | Errors
    | CommandErrors
    | ConstraintErrors
    | ModuleErrors
    | SystemMessages
    | Modules
    | Friends;

export interface Parameters {
    [index: string]: string | number;
}
