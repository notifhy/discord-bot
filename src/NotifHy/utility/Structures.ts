import type { MessageSelectMenuOptions } from 'discord.js';
import type {
    SelectMenuLocale,
    SelectMenuStructure,
    SelectMenuTopLocale,
    SelectMenuTopStructure,
} from '../@types/locales';
import { Constants } from './Constants';

export function combiner(
    locale: { select: SelectMenuLocale } & SelectMenuTopLocale,
    structure: { select: SelectMenuStructure } & SelectMenuTopStructure,
) {
    const clonedLocale = structuredClone(locale);
    const clonedStructure = structuredClone(structure);

    const combined = { ...clonedLocale, ...clonedStructure };

    combined.select = { ...clonedLocale.select, ...clonedStructure.select };

    const options = clonedLocale.select.options.map(
        (option: Record<string, unknown>, index: number) => ({
            ...option,
            ...structure.select.options[index]!,
        }),
    );

    combined.select.options = options;

    return combined as unknown as {
        select: MessageSelectMenuOptions
    } & SelectMenuLocale & SelectMenuStructure;
}

export const Structures = {
    defender: {
        toggle: {
            value: 'toggle',
            emoji: Constants.emoji.zap,
            button: {
                enableCustomID: 'toggle1',
                disableCustomID: 'toggle0',
            },
        },
        alerts: {
            value: 'alerts',
            emoji: Constants.emoji.bell,
            select: {
                customId: 'alerts',
                minValues: 0,
                maxValues: 5,
                disabled: false,
                options: [
                    {
                        value: 'login',
                    },
                    {
                        value: 'logout',
                    },
                    {
                        value: 'version',
                    },
                    {
                        value: 'gameType',
                    },
                    {
                        value: 'language',
                    },
                ],
            },
        },
        channel: {
            value: 'channel',
            emoji: Constants.emoji.hash,
            select: {
                customId: 'null',
                disabled: true,
                options: [
                    {
                        value: 'hello',
                    },
                ],
            },
        },
        gameTypes: {
            value: 'gameTypes',
            emoji: Constants.emoji.shieldlock,
            select: {
                customId: 'gameTypes',
                minValues: 0,
                maxValues: 25,
                disabled: false,
                options: [
                    {
                        value: 'ARCADE',
                    },
                    {
                        value: 'ARENA',
                    },
                    {
                        value: 'BEDWARS',
                    },
                    {
                        value: 'SURVIVAL_GAMES',
                    },
                    {
                        value: 'BUILD_BATTLE',
                    },
                    {
                        value: 'MCGO',
                    },
                    {
                        value: 'DUELS',
                    },
                    {
                        value: 'HOUSING',
                    },
                    {
                        value: 'WALLS3',
                    },
                    {
                        value: 'MURDER_MYSTERY',
                    },
                    {
                        value: 'PAINTBALL',
                    },
                    {
                        value: 'PIT',
                    },
                    {
                        value: 'PROTOTYPE',
                    },
                    {
                        value: 'QUAKECRAFT',
                    },
                    {
                        value: 'SKYBLOCK',
                    },
                    {
                        value: 'SKYWARS',
                    },
                    {
                        value: 'SUPER_SMASH',
                    },
                    {
                        value: 'SMP',
                    },
                    {
                        value: 'SPEED_UHC',
                    },
                    {
                        value: 'WALLS',
                    },
                    {
                        value: 'TNTGAMES',
                    },
                    {
                        value: 'GINGERBREAD',
                    },
                    {
                        value: 'VAMPIREZ',
                    },
                    {
                        value: 'UHC',
                    },
                    {
                        value: 'BATTLEGROUND',
                    },
                ],
            },
        },
        languages: {
            value: 'languages',
            emoji: Constants.emoji.commentdiscussion,
            select: {
                customId: 'languages',
                minValues: 0,
                maxValues: 15,
                disabled: false,
                options: [
                    {
                        value: 'CHINESE_SIMPLIFIED',
                    },
                    {
                        value: 'CHINESE_TRADITIONAL',
                    },
                    {
                        value: 'CZECH',
                    },
                    {
                        value: 'DUTCH',
                    },
                    {
                        value: 'ENGLISH',
                    },
                    {
                        value: 'PIRATE',
                    },
                    {
                        value: 'FINNISH',
                    },
                    {
                        value: 'FRENCH',
                    },
                    {
                        value: 'GERMAN',
                    },
                    {
                        value: 'TURKISH',
                    },
                    {
                        value: 'ITALIAN',
                    },
                    {
                        value: 'JAPANESE',
                    },
                    {
                        value: 'KOREAN',
                    },
                    {
                        value: 'PORTUGUESE_BR',
                    },
                    {
                        value: 'PORTUGUESE',
                    },
                    {
                        value: 'RUSSIAN',
                    },
                    {
                        value: 'SPANISH',
                    },
                    {
                        value: 'GREEK',
                    },
                ],
            },
        },
        versions: {
            value: 'versions',
            emoji: Constants.emoji.gitbranch,
            select: {
                customId: 'versions',
                minValues: 0,
                maxValues: 8,
                disabled: false,
                options: [
                    {
                        value: '1.8',
                    },
                    {
                        value: '1.12',
                    },
                    {
                        value: '1.14',
                    },
                    {
                        value: '1.15',
                    },
                    {
                        value: '1.16',
                    },
                    {
                        value: '1.17',
                    },
                    {
                        value: '1.18',
                    },
                    {
                        value: '1.19',
                    },
                ],
            },
        },
    },
    friends: {
        toggle: {
            value: 'toggle',
            emoji: Constants.emoji.zap,
            button: {
                enableCustomID: 'toggle1',
                disableCustomID: 'toggle0',
            },
        },
        channel: {
            value: 'channel',
            emoji: Constants.emoji.hash,
            select: {
                customId: 'null',
                disabled: true,
                options: [
                    {
                        value: 'hello',
                    },
                ],
            },
        },
    },
    rewards: {
        toggle: {
            value: 'toggle',
            emoji: Constants.emoji.zap,
            button: {
                enableCustomID: 'toggle1',
                disableCustomID: 'toggle0',
            },
        },
        alertTime: {
            value: 'alertTime',
            emoji: Constants.emoji.hourglass,
            select: {
                customId: 'alertTime',
                disabled: false,
                options: [
                    {
                        value: '86400000',
                    },
                    {
                        value: '82800000',
                    },
                    {
                        value: '79200000',
                    },
                    {
                        value: '75600000',
                    },
                    {
                        value: '72000000',
                    },
                    {
                        value: '68400000',
                    },
                    {
                        value: '64800000',
                    },
                    {
                        value: '61200000',
                    },
                    {
                        value: '57600000',
                    },
                    {
                        value: '54000000',
                    },
                    {
                        value: '50400000',
                    },
                    {
                        value: '46800000',
                    },
                    {
                        value: '43200000',
                    },
                    {
                        value: '39600000',
                    },
                    {
                        value: '36000000',
                    },
                    {
                        value: '32400000',
                    },
                    {
                        value: '28800000',
                    },
                    {
                        value: '25200000',
                    },
                    {
                        value: '21600000',
                    },
                    {
                        value: '18000000',
                    },
                    {
                        value: '14400000',
                    },
                    {
                        value: '10800000',
                    },
                    {
                        value: '7200000',
                    },
                    {
                        value: '3600000',
                    },
                ],
            },
        },
        claimNotification: {
            value: 'claimNotification',
            emoji: Constants.emoji.issueclosed,
            button: {
                enableCustomID: 'claimNotification1',
                disableCustomID: 'claimNotification0',
            },
        },
        milestones: {
            value: 'milestones',
            emoji: Constants.emoji.trophy,
            button: {
                enableCustomID: 'milestones1',
                disableCustomID: 'milestones0',
            },
        },
        notificationInterval: {
            value: 'notificationInterval',
            emoji: Constants.emoji.sync,
            select: {
                customId: 'notificationInterval',
                disabled: false,
                options: [
                    {
                        value: '1800000',
                    },
                    {
                        value: '3600000',
                    },
                    {
                        value: '7200000',
                    },
                    {
                        value: '10800000',
                    },
                    {
                        value: '14400000',
                    },
                    {
                        value: '18000000',
                    },
                    {
                        value: '21600000',
                    },
                ],
            },
        },
    },
};