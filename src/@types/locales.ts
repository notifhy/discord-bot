import type {
    MessageSelectMenuOptions,
    MessageSelectOptionData,
} from 'discord.js';

/*
Universal Module Data Separation Stuff
*/
export interface SelectMenuTopLocale {
    label: string,
    description: string,
    longDescription: string,
}

export interface SelectMenuTopStructure {
    value: string,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SelectMenuOptionLocale extends Omit<MessageSelectOptionData, 'value'> {

}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SelectMenuOptionStructure extends Omit<MessageSelectOptionData, 'label'> {

}

export interface SelectMenuLocale extends Omit<MessageSelectMenuOptions, 'customId' | 'options'> {
    options: SelectMenuOptionLocale[],
}

export interface SelectMenuStructure extends Omit<MessageSelectMenuOptions, 'options'> {
    options: SelectMenuOptionStructure[],
}

/*
Toggle Buttons
*/

export interface LocaleButton {
    enable: string,
    disable: string,
}

export interface ButtonData {
    enableCustomID: string,
    disableCustomID: string,
}

/*
General Interfaces
*/
export interface BaseEmbed {
    title: string,
    description: string,
}

export interface Field {
    name: string,
    value: string,
}

/*
Command Interface
*/
export interface AccessDB {
    decrypted: BaseEmbed,
    encrypted: BaseEmbed,
}

export interface API {
    api: {
        yes: string,
        no: string,
        enabled: Field,
        resume: Field,
        rateLimit: Field,
        lastHour: Field,
        nextTimeouts: Field,
        apiKey: Field,
    }
    set: BaseEmbed,
    call: BaseEmbed,
}

export interface Channel {
    dms: string,
    botMissingPermission: BaseEmbed,
    userMissingPermission: BaseEmbed,
    defender: {
        alreadySet: BaseEmbed,
        set: BaseEmbed,
        remove: BaseEmbed,
    },
    friends: {
        alreadySet: BaseEmbed,
        set: BaseEmbed,
    },
}

export interface Config {
    on: string,
    off: string,
    blockGuild: {
        add: BaseEmbed,
        remove: BaseEmbed,
    },
    blockUser: {
        add: BaseEmbed,
        remove: BaseEmbed,
    },
    core: BaseEmbed,
    devMode: BaseEmbed,
    keyPercentage: BaseEmbed,
    restRequestTimeout: BaseEmbed,
    retryLimit: BaseEmbed,
    view: BaseEmbed;
}

export interface Data {
    delete: {
        confirm: BaseEmbed,
        deleted: BaseEmbed,
        aborted: BaseEmbed,
        yesButton: string,
        noButton: string,
    },
    history: {
        embed: BaseEmbed,
        null: string,
        keys: {
            firstLogin: string,
            lastLogin: string,
            lastLogout: string,
            version: string,
            language: string,
            lastClaimedReward: string,
            rewardScore: string,
            rewardHighScore: string,
            totalDailyRewards: string,
            totalRewards: string,
            gameType: string,
            gameMode: string,
            gameMap: string,
        },
    },
}

export interface Deploy {
    title: string,
    none: string,
}

export interface Eval {
    maxLength: Field,
    success: {
        title: string,
        input: Field,
        output: Field,
        type: Field,
        timeTaken: Field,
    },
    fail: {
        title: string,
        input: Field,
    }
}

export interface Help {
    information: {
        introduction: Field,
        modules: Field,
        setup: Field,
        other: Field,
        legal: Field,
    },
    all: {
        title: string,
        field: Field,
    },
    specific: {
        invalid: BaseEmbed,
        title: string,
        description: string,
        cooldown: Field,
        dm: Field,
        owner: Field,
    },
}

export interface Language {
    alreadyRemoved: BaseEmbed,
    reset: BaseEmbed,
    set: BaseEmbed,
}

export interface ModulesCommand {
    defender: {
        title: string,
        description: string,
        menuPlaceholder: string,
        missingConfigField: {
            name: string,
            value: string,
        },
        menu: {
            toggle: {
                button: LocaleButton,
            } & SelectMenuTopLocale,
            alerts: {
                select: SelectMenuLocale,
            } & SelectMenuTopLocale,
            channel: {
                select: SelectMenuLocale,
            } & SelectMenuTopLocale,
            gameTypes: {
                select: SelectMenuLocale,
            } & SelectMenuTopLocale,
            languages: {
                select: SelectMenuLocale,
            } & SelectMenuTopLocale,
            versions: {
                select: SelectMenuLocale,
            } & SelectMenuTopLocale,
        },
    },
    friends: {
        title: string,
        description: string,
        menuPlaceholder: string,
        missingConfigField: {
            name: string,
            value: string,
        },
        menu: {
            toggle: {
                button: LocaleButton,
            } & SelectMenuTopLocale,
            channel: {
                select: SelectMenuLocale
            } & SelectMenuTopLocale,
        },
    },
    rewards: {
        title: string,
        description: string,
        menuPlaceholder: string,
        missingConfigField: {
            name: string,
            value: string,
        },
        menu: {
            toggle: {
                button: LocaleButton
            } & SelectMenuTopLocale,
            alertTime: {
                select: SelectMenuLocale,
            } & SelectMenuTopLocale,
            claimNotification: {
                button: LocaleButton,
            } & SelectMenuTopLocale,
            milestones: {
                button: LocaleButton,
            } & SelectMenuTopLocale,
            notificationInterval: {
                select: SelectMenuLocale,
            } & SelectMenuTopLocale,
        },
    },
}

export interface Performance {
    title: string,
    latest: Field,
}

export interface Ping {
    embed1: {
        title: string,
    },
    embed2: BaseEmbed,
}

export interface Player {
    invalid: BaseEmbed,
    notFound: BaseEmbed,
    unknown: string,
    status: {
        online: string,
        offline: string,
        embed: {
            field1: Field,
            field2: Field,
            field3: Field,
            onlineField: Field,
            offlineField: Field,
        } & BaseEmbed,
    }
    recentGames: {
        playTime: string,
        elapsed: string,
        gameMode: string,
        gameMap: string,
        inProgress: string,
        embed: {
            field: Field,
        } & BaseEmbed,
    }
}

export interface Presence {
    set: {
        none: string,
        title: string,
        status: Field,
        type: Field,
        name: Field,
        url: Field,
    },
    cleared: BaseEmbed,
}

export interface Register {
    alreadyRegistered: BaseEmbed;
    invalid: BaseEmbed,
    notFound: BaseEmbed,
    alreadyUsed: BaseEmbed,
    unlinked: BaseEmbed,
    mismatched: BaseEmbed,
    testEmbed: BaseEmbed,
    success: BaseEmbed,
    cannotMessage: Field,
    next: Field,
}

export interface Reload {
    all: BaseEmbed,
    single: {
        unknown: BaseEmbed,
        success: BaseEmbed,
    }
}

export interface Snowflake {
    title: string,
    input: Field,
    length: Field,
    date: Field,
    worker: Field,
    process: Field,
    increment: Field,
}

export interface System {
    embed: {
        title: string,
        field1: Field,
        field2: Field,
        field3: Field,
        field4: Field,
        field5: Field,
        field6: Field,
    }
}

export interface SystemMessage {
    notFound: BaseEmbed,
    preview: {
        buttonLabel: string
    } & BaseEmbed,
    success: BaseEmbed,
}

export interface Commands {
    accessdb: AccessDB,
    api: API,
    channel: Channel,
    config: Config,
    data: Data,
    deploy: Deploy,
    eval: Eval,
    help: Help,
    language: Language,
    modules: ModulesCommand,
    performance: Performance,
    ping: Ping,
    player: Player,
    presence: Presence,
    register: Register,
    reload: Reload,
    snowflake: Snowflake,
    system: System,
    systemmessage: SystemMessage,
}

/*
Errors
*/
export interface CommandErrors {
    embed: {
        field: Field,
    } & BaseEmbed,
}

export interface ConstraintErrors {
    blockedUsers: BaseEmbed,
    devMode: BaseEmbed,
    owner: BaseEmbed,
    register: BaseEmbed;
    dm: BaseEmbed,
    cooldown: {
        embed1: BaseEmbed,
        embed2: BaseEmbed,
    },
}

export interface ModuleErrors {
    alert: {
        title: string,
        footer: string,
    },
    10003: Field,
    10013: Field,
    50001: Field,
    50007: Field,
    50013: Field,
    http: Field,
}

export interface SystemMessages {
    embed: {
        footer: string,
    } & BaseEmbed,
}

export interface Errors {
    commandErrors: CommandErrors,
    constraintErrors: ConstraintErrors,
    moduleErrors: ModuleErrors,
    systemMessages: SystemMessages,
}

/*
Modules
*/
export interface Defender {
    gameType: {
        null: string,
    } & Field,
    login: Field,
    logout: Field,
    language: Field,
    version: Field,
    embed: {
        title: string,
        footer: string,
    },
    missingPermissions: Field,
}

export interface Friends {
    missingPermissions: Field,
    suppressNext: {
        footer: string,
    } & BaseEmbed,
    login: {
        description: string,
    },
    logout: {
        description: string,
    },
}

export interface Rewards {
    claimedNotification: {
        footer: string,
    } & BaseEmbed,
    milestone: {
        footer: string,
    } & BaseEmbed,
    rewardReminder: {
        title: string,
        footer: string,
        description: string[],
    },
}

export interface Modules {
    statusAPIMissing: {
        footer: string,
    } & BaseEmbed,
    statusAPIReceived: {
        footer: string,
    } & BaseEmbed,
    defender: Defender,
    friends: Friends,
    rewards: Rewards,
}

/*
Base
*/
export interface Locale {
    errors: Errors,
    commands: Commands,
    modules: Modules,
    deprecation: {
        title: string
        description: string;
    }
}

export interface Locales {
    'en-US': Locale,
}

export interface Parameters {
    [index: string]: unknown,
}