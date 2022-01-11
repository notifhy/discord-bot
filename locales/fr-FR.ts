import Constants from '../src/util/Constants';

export default {
    commands: {
        data: {
            delete: {
                confirm: {
                    title: 'Confirmation',
                    description: 'Are you absolutely sure that you want to delete all of your data? All your data stored in the database will be wiped. This is irreversible. Please confirm with the buttons below. As a side note, you can view all of your data with /data view.',
                },
                deleted: {
                    title: 'Deleted',
                    description: 'Your data has been deleted.',
                },
                aborted: {
                    title: 'Aborted',
                    description: 'Deletion aborted.',
                },
                yesButton: 'Yes',
                noButton: 'No',
            },
            history: {
                embed: {
                    title: 'History',
                    description: '• Showing %{start}% to %{end}% out of %{total}%\n• Saves up to %{max}% events',
                },
                null: 'None',
                keys: {
                    firstLogin: 'First Login: ',
                    lastLogin: 'Last Login: ',
                    lastLogout: 'Last Logout: ',
                    version: 'Version: ',
                    language: 'Language: ',
                    lastClaimedReward: 'Last Reward Claimed: ',
                    rewardScore: 'Daily Rewards Streak: ',
                    rewardHighScore: 'Best Daily Reward Streak: ',
                    totalDailyRewards: 'Total Daily Rewards: ',
                    totalRewards: 'Total Rewards: ',
                    gameType: 'Game Type: ',
                    gameMode: 'Mode: ',
                    gameMap: 'Map: ',
                },
            },
        },
        help: {
            information: {
                title: 'Information',
                description: 'placeholder',
            },
            all: {
                title: 'Commands',
                field: {
                    name: '**/%{commandName}%**',
                    value: '%{commandDescription}%',
                },
            },
            specific: {
                invalid: {
                    title: 'Invalid Command!',
                    description: "/%{command}% isn't a valid command!",
                },
                title: '/%{command}%',
                description: '%{commandDescription}%',
                cooldown: {
                    name: 'Command Cooldown',
                    value: '%{commandCooldown}% second(s)',
                },
                dm: {
                    name: 'Direct Messages',
                    value: 'This command cannot be used in a DM channel',
                },
                owner: {
                    name: 'Bot Owner',
                    value: 'Being an owner is required to execute this command',
                },
            },
        },
        language: {
            alreadySet: {
                title: 'Already Set',
                description: '%{language}% is already your set language!',
            },
            title: 'Language Set',
            description: 'Your language has been changed to `%{language}%`!',
        },
        modules: {
            defender: {
                title: 'Defender Module',
                description: 'The replacement for HyGuard - get notified on logins, logouts, version changes, and more',
                menuPlaceholder: 'Defender Module Settings',
                missingConfigField: {
                    name: 'Missing Configuration',
                    value: 'You need to configure the following settings before enabling the Defender module: %{missingRequirements}%. Click on the menu below, select the option(s), and configure it.',
                },
                menu: {
                    toggle: {
                        label: 'Toggle',
                        description: 'Toggle whether this module is active',
                        longDescription: 'Enable or disable this module. However, this module will not be activated if you have not configured it.',
                        value: 'toggle',
                        emoji: Constants.emoji.power,
                        button: {
                            enable: 'Enable',
                            disable: 'Disable',
                            enableCustomID: 'toggle1',
                            disableCustomID: 'toggle0',
                        },
                    },
                    alerts: {
                        label: 'Alerts',
                        description: 'Select alerts to receive for the defender module',
                        longDescription: 'Toggle alerts for the defender module. You can individually toggle each type of notification.',
                        value: 'alerts',
                        emoji: Constants.emoji.alert,
                        select: {
                            customId: 'alerts',
                            placeholder: 'Select your alerts',
                            minValues: 0,
                            maxValues: 5,
                            disabled: false,
                            options: [
                                {
                                    label: 'Login',
                                    value: 'login',
                                    description: 'Toggle login alerts',
                                },
                                {
                                    label: 'Logout',
                                    value: 'logout',
                                    description: 'Toggle logout alerts',
                                },
                                {
                                    label: 'Version',
                                    value: 'version',
                                    description: 'Toggle version alerts',
                                },
                                {
                                    label: 'Game Type',
                                    value: 'gameType',
                                    description: 'Toggle game type alerts',
                                },
                                {
                                    label: 'Language',
                                    value: 'language',
                                    description: 'Toggle language alerts',
                                },
                            ],
                        },
                    },
                    channel: {
                        label: 'Channel',
                        description: 'Set a channel to send alerts to',
                        longDescription: 'Due to limitations, you need to set a channel with /channel. You can also choose to leave this field empty; alerts will be sent via Direct Messages instead.',
                        value: 'channel',
                        emoji: Constants.emoji.hashtag,
                        select: {
                            customId: 'null',
                            placeholder: 'Select a channel',
                            disabled: true,
                            options: [
                                {
                                    label: 'Disabled',
                                    value: 'hello',
                                    description: 'Disabled',
                                },
                            ],
                        },
                    },
                    gameTypes: {
                        label: 'Blacklisted Game Type(s)',
                        description: 'Select blacklisted game type(s)',
                        longDescription: 'Select blacklisted game type(s). If the bot detects your account playing these games, you will be notified.',
                        value: 'gameTypes',
                        emoji: Constants.emoji.swords,
                        select: {
                            customId: 'gameTypes',
                            placeholder: 'None',
                            minValues: 0,
                            maxValues: 25,
                            disabled: false,
                            options: [
                                {
                                    label: 'Arcade',
                                    value: 'ARCADE',
                                },
                                {
                                    label: 'Arena',
                                    value: 'ARENA',
                                },
                                {
                                    label: 'Bed Wars',
                                    value: 'BEDWARS',
                                },
                                {
                                    label: 'Blitz Survival Games',
                                    value: 'SURVIVAL_GAMES',
                                },
                                {
                                    label: 'Build Battle',
                                    value: 'BUILD_BATTLE',
                                },
                                {
                                    label: 'Cops and Crims',
                                    value: 'MCGO',
                                },
                                {
                                    label: 'Duels',
                                    value: 'DUELS',
                                },
                                {
                                    label: 'Housing',
                                    value: 'HOUSING',
                                },
                                {
                                    label: 'Mega Walls',
                                    value: 'WALLS3',
                                },
                                {
                                    label: 'Murder Mystery',
                                    value: 'MURDER_MYSTERY',
                                },
                                {
                                    label: 'Paintball',
                                    value: 'PAINTBALL',
                                },
                                {
                                    label: 'Pit',
                                    value: 'PIT',
                                },
                                {
                                    label: 'Prototype',
                                    value: 'PROTOTYPE',
                                },
                                {
                                    label: 'Quake',
                                    value: 'QUAKECRAFT',
                                },
                                {
                                    label: 'SkyBlock',
                                    value: 'SKYBLOCK',
                                },
                                {
                                    label: 'SkyWars',
                                    value: 'SKYWARS',
                                },
                                {
                                    label: 'Smash Heroes',
                                    value: 'SUPER_SMASH',
                                },
                                {
                                    label: 'SMP',
                                    value: 'SMP',
                                },
                                {
                                    label: 'Speed UHC',
                                    value: 'SPEED_UHC',
                                },
                                {
                                    label: 'Walls',
                                    value: 'WALLS',
                                },
                                {
                                    label: 'TNT Games',
                                    value: 'TNTGAMES',
                                },
                                {
                                    label: 'Turbo Kart Racers',
                                    value: 'GINGERBREAD',
                                },
                                {
                                    label: 'VampireZ',
                                    value: 'VAMPIREZ',
                                },
                                {
                                    label: 'UHC Champions',
                                    value: 'UHC',
                                },
                                {
                                    label: 'Warlords',
                                    value: 'BATTLEGROUND',
                                },
                            ],
                        },
                    },
                    languages: {
                        label: 'Whitelisted Language(s)',
                        description: 'Select whitelisted languages(s)',
                        longDescription: 'Select whitelisted version(s) for use on Hypixel. If the bot detects you switching to a whitelisted language, it will not alert or notify you. Select none to get a notification on every language change.',
                        value: 'languages',
                        emoji: Constants.emoji.speech,
                        select: {
                            customId: 'languages',
                            placeholder: 'None',
                            minValues: 0,
                            maxValues: 15,
                            disabled: false,
                            options: [
                                {
                                    label: '简体中文 (Chinese Simplified)',
                                    value: 'CHINESE_SIMPLIFIED',
                                },
                                {
                                    label: '繁體中文 (Chinese Traditional)',
                                    value: 'CHINESE_TRADITIONAL',
                                },
                                {
                                    label: 'Čeština (Czech)',
                                    value: 'CZECH',
                                },
                                {
                                    label: 'Nederlands (Dutch)',
                                    value: 'DUTCH',
                                },
                                {
                                    label: 'English (English)',
                                    value: 'ENGLISH',
                                },
                                {
                                    label: 'Pirate (English)',
                                    value: 'PIRATE',
                                },
                                {
                                    label: 'Suomi (Finnish)',
                                    value: 'FINNISH',
                                },
                                {
                                    label: 'Français (French)',
                                    value: 'FRENCH',
                                },
                                {
                                    label: 'Deutsch (German)',
                                    value: 'German',
                                },
                                {
                                    label: 'Ελληνική (Greek)',
                                    value: 'TURKISH',
                                },
                                {
                                    label: 'Italiano (Italian)',
                                    value: 'ITALIAN',
                                },
                                {
                                    label: '日本語 (Japanese)',
                                    value: 'JAPANESE',
                                },
                                {
                                    label: '한국어 (Korean)',
                                    value: 'KOREAN',
                                },
                                {
                                    label: 'Português do Brasil (Portuguese Brasil)',
                                    value: 'PORTUGUESE_BR',
                                },
                                {
                                    label: 'Português (Portuguese Portugal)',
                                    value: 'PORTUGUESE',
                                },
                                {
                                    label: 'Русский (Russian)',
                                    value: 'RUSSIAN',
                                },
                                {
                                    label: 'Español (Spanish)',
                                    value: 'SPANISH',
                                },
                                {
                                    label: 'Türkçe (Turkish)',
                                    value: 'GREEK',
                                },
                            ],
                        },
                    },
                    versions: {
                        label: 'Whitelisted Version(s)',
                        description: 'Select whitelisted version(s) of Minecraft',
                        longDescription: 'Select whitelisted version(s) of Minecraft. If the bot detects you switching to a whitelisted version, it will not alert or notify you. Select none to get a notification on every version change.',
                        value: 'versions',
                        emoji: Constants.emoji.version,
                        select: {
                            customId: 'versions',
                            placeholder: 'None',
                            minValues: 0,
                            maxValues: 9,
                            disabled: false,
                            options: [
                                {
                                    label: '1.8',
                                    value: '1.8',
                                },
                                {
                                    label: '1.11',
                                    value: '1.11',
                                },
                                {
                                    label: '1.12',
                                    value: '1.12',
                                },
                                {
                                    label: '1.13',
                                    value: '1.13',
                                },
                                {
                                    label: '1.14',
                                    value: '1.14',
                                },
                                {
                                    label: '1.15',
                                    value: '1.15',
                                },
                                {
                                    label: '1.16',
                                    value: '1.16',
                                },
                                {
                                    label: '1.17',
                                    value: '1.17',
                                },
                                {
                                    label: '1.18',
                                    value: '1.18',
                                },
                            ],
                        },
                    },
                },
            },
            friends: {
                title: 'Friends Module',
                description: 'Know when your friends are online without asking or logging onto Hypixel by sharing logins and logouts with each other. This module sends your logins and logouts to a specified channel; have your friends set this module up to share with each other. ',
                menuPlaceholder: 'Friend Module Settings',
                missingConfigField: {
                    name: 'Missing Configuration',
                    value: 'You need to configure the following settings before enabling the Friend module: %{missingRequirements}%. Click on the menu below, select the option(s), and configure it.',
                },
                menu: {
                    toggle: {
                        label: 'Toggle',
                        description: 'Toggle whether this module is active',
                        longDescription: 'Enable or disable this module. However, this module cannot be enabled if you have not configured it.',
                        value: 'toggle',
                        emoji: Constants.emoji.power,
                        button: {
                            enable: 'Enable',
                            disable: 'Disable',
                            enableCustomID: 'toggle1',
                            disableCustomID: 'toggle0',
                        },
                    },
                    channel: {
                        label: 'Channel',
                        description: 'Set a channel to send logins and logouts to',
                        longDescription: 'Due to limitations, you need to set a channel with /channel',
                        value: 'channel',
                        emoji: Constants.emoji.hashtag,
                        select: {
                            customId: 'null',
                            placeholder: 'Select a channel',
                            disabled: true,
                            options: [
                                {
                                    label: 'Disabled',
                                    value: 'hello',
                                    description: 'Disabled',
                                },
                            ],
                        },
                    },
                },
            },
            rewards: {
                title: 'Rewards Module',
                description: 'Never miss a daily reward again - get notifications to claim your daily reward at your convenience!',
                menuPlaceholder: 'Reward Module Settings',
                missingConfigField: {
                    name: 'Missing Configuration',
                    value: 'You need to configure the following settings before enabling the Rewards module: %{missingRequirements}%. Click on the menu below, select the option(s), and configure it.',
                },
                menu: {
                    toggle: {
                        label: 'Toggle',
                        description: 'Toggle whether this module is active',
                        longDescription: 'Enable or disable this module.',
                        value: 'toggle',
                        emoji: Constants.emoji.power,
                        button: {
                            enable: 'Enable',
                            disable: 'Disable',
                            enableCustomID: 'toggle1',
                            disableCustomID: 'toggle0',
                        },
                    },
                    alertTime: {
                        label: 'Grace Period',
                        description: 'Set when the bot should start alerting you',
                        longDescription: 'Set the amount of hours ahead of the daily reward reset for when the bot should start pinging you.',
                        value: 'alertTime',
                        emoji: Constants.emoji.clock,
                        select: {
                            customId: 'alertTime',
                            placeholder: 'Select a time',
                            disabled: false,
                            options: [
                                {
                                    label: 'Immediately',
                                    value: '86400000',
                                    description: 'Immediately after the next daily reset (12 AM EST)',
                                },
                                {
                                    label: '1 hour',
                                    value: '3600000',
                                    description: '1 hour before the next daily reset (11 PM EST)',
                                },
                                {
                                    label: '2 hours',
                                    value: '7200000',
                                    description: '2 hours before the next daily reset (10 PM EST)',
                                },
                                {
                                    label: '3 hours',
                                    value: '10800000',
                                    description: '3 hours before the next daily reset (9 PM EST)',
                                },
                                {
                                    label: '4 hours',
                                    value: '14400000',
                                    description: '4 hours before the next daily reset (8 PM EST)',
                                },
                                {
                                    label: '5 hours',
                                    value: '18000000',
                                    description: '5 hours before the next daily reset (7 PM EST)',
                                },
                                {
                                    label: '6 hours',
                                    value: '21600000',
                                    description: '6 hours before the next daily reset (6 PM EST)',
                                },
                                {
                                    label: '7 hours',
                                    value: '25200000',
                                    description: '7 hours before the next daily reset (5 PM EST)',
                                },
                                {
                                    label: '8 hours',
                                    value: '28800000',
                                    description: '8 hours before the next daily reset (4 PM EST)',
                                },
                                {
                                    label: '9 hours',
                                    value: '32400000',
                                    description: '9 hours before the next daily reset (3 PM EST)',
                                },
                                {
                                    label: '10 hours',
                                    value: '36000000',
                                    description: '10 hours before the next daily reset (2 PM EST)',
                                },
                                {
                                    label: '11 hours',
                                    value: '39600000',
                                    description: '11 hours before the next daily reset (1 PM EST)',
                                },
                                {
                                    label: '12 hours',
                                    value: '43200000',
                                    description: '12 hours before the next daily reset (12 PM EST)',
                                },
                                {
                                    label: '13 hours',
                                    value: '46800000',
                                    description: '13 hours before the next daily reset (11 AM EST)',
                                },
                                {
                                    label: '14 hours',
                                    value: '50400000',
                                    description: '14 hours before the next daily reset (10 AM EST)',
                                },
                                {
                                    label: '15 hours',
                                    value: '54000000',
                                    description: '15 hours before the next daily reset (9 AM EST)',
                                },
                                {
                                    label: '16 hours',
                                    value: '57600000',
                                    description: '16 hours before the next daily reset (8 AM EST)',
                                },
                                {
                                    label: '17 hours',
                                    value: '61200000',
                                    description: '17 hours before the next daily reset (7 AM EST)',
                                },
                                {
                                    label: '18 hours',
                                    value: '64800000',
                                    description: '18 hours before the next daily reset (6 AM EST)',
                                },
                                {
                                    label: '19 hours',
                                    value: '68400000',
                                    description: '19 hours before the next daily reset (5 AM EST)',
                                },
                                {
                                    label: '20 hours',
                                    value: '72000000',
                                    description: '20 hours before the next daily reset (4 AM EST)',
                                },
                                {
                                    label: '21 hours',
                                    value: '75600000',
                                    description: '21 hours before the next daily reset (3 AM EST)',
                                },
                                {
                                    label: '22 hours',
                                    value: '79200000',
                                    description: '22 hours before the next daily reset (2 AM EST)',
                                },
                                {
                                    label: '23 hours',
                                    value: '82800000',
                                    description: '23 hours before the next daily reset (1 AM EST)',
                                },
                            ],
                        },
                    },
                    claimNotification: {
                        label: 'Claim Notification',
                        description: 'Toggle notifications for when you claim the reward',
                        longDescription: 'Toggle whether you get a confirmation when you collect the reward. It also comes with your current streak and total daily rewards!',
                        value: 'claimNotification',
                        emoji: Constants.emoji.checkmark,
                        button: {
                            enable: 'Enable',
                            disable: 'Disable',
                            enableCustomID: 'claimNotification1',
                            disableCustomID: 'claimNotification0',
                        },
                    },
                    milestones: {
                        label: 'Reward Milestones',
                        description: 'Receive a congratulation on achieving streak milestones',
                        longDescription: `Receive a DM congratulating you when you hit a daily streak listed in the following: ${Constants.modules.rewards.milestones.join(', ')}`,
                        value: 'milestones',
                        emoji: Constants.emoji.celebration,
                        button: {
                            enable: 'Enable',
                            disable: 'Disable',
                            enableCustomID: 'milestones1',
                            disableCustomID: 'milestones0',
                        },
                    },
                    notificationInterval: {
                        label: 'Notification Interval',
                        description: 'Set the timeout between pings',
                        longDescription: 'Set how long the bot should wait before pinging you again.',
                        value: 'notificationInterval',
                        emoji: Constants.emoji.interval,
                        select: {
                            customId: 'notificationInterval',
                            placeholder: 'Select a time',
                            disabled: false,
                            options: [
                                {
                                    label: '30 minutes',
                                    value: '1800000',
                                },
                                {
                                    label: '1 hour',
                                    value: '3600000',
                                },
                                {
                                    label: '2 hours',
                                    value: '7200000',
                                },
                                {
                                    label: '3 hours',
                                    value: '10800000',
                                },
                                {
                                    label: '4 hours',
                                    value: '14400000',
                                },
                                {
                                    label: '5 hours',
                                    value: '18000000',
                                },
                                {
                                    label: '6 hours',
                                    value: '21600000',
                                },
                            ],
                        },
                    },
                },
            },
        },
        ping: {
            embed1: {
                title: 'Pinging..',
            },
            embed2: {
                title: '🏓 Ping!',
                description: 'Websocket heartbeat is %{wsPing}%ms. Roundtrip latency is %{rtPing}%ms.',
            },
        },
        player: {
            invalid: {
                title: 'Invalid Input',
                description: 'The username/UUID provided is invalid! The username cannot contain invalid characters. UUIDs must match the following regex: `/^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89AB][0-9a-f]{3}[0-9a-f]{12}$/i`. You can test this regex with [__this__](https://regex101.com/r/A866mm/1) site.',
            },
            notFound: {
                title: 'Not Found',
                description: "That %{inputType}% doesn't seem to be valid. Check to see if you spelt it wrong.",
            },
            unknown: 'Unknown',
            status: {
                online: 'online',
                offline: 'offline',
                embed: {
                    title: 'Status',
                    description: '%{username}% is %{status}%',
                    field1: {
                        name: 'Identity',
                        value: 'UUID: %{uuid}%\nTwitter: %{TWITTER}%\nInstagram: %{INSTAGRAM}%\nTwitch: %{TWITCH}%\nDiscord: %{DISCORD}%\nHypixel: %{HYPIXEL}%',
                    },
                    field2: {
                        name: 'Last Login & Logout',
                        value: 'Last Login: %{lastLogin}%\nLast Logout: %{lastLogout}%',
                    },
                    field3: {
                        name: 'Settings',
                        value: 'Language: %{language}%\nVersion: %{version}%',
                    },
                    onlineField: {
                        name: 'Session',
                        value: 'Playtime: %{playTime}%\nGame Type: %{gameType}%\nGame Mode: %{gameMode}%\nGame Map: %{gameMap}%',
                    },
                    offlineField: {
                        name: 'Last Session',
                        value: 'Last Playtime: %{playTime}%\nLast Game Type: %{gameType}%',
                    },
                },
            },
            recentGames: {
                playTime: 'Play Time: ',
                elapsed: 'Elapsed: ',
                gameMode: 'Mode: ',
                gameMap: 'Map: ',
                inProgress: 'In Progress',
                embed: {
                    title: 'Recent Games - %{username}%',
                    description: '• Showing %{start}% to %{end}% out of %{total}%\n• Saves up to 100 events\n• Saves events for up to 3 days',
                    field: {
                        name: '%{gameType}% | %{date}%',
                        value: 'Game Start: %{start}%\nGame End: %{end}%\n%{playTime}%%{mode}%%{map}%',
                    },
                },
            },
        },
        register: {
            invalid: {
                title: 'Invalid Input',
                description: 'The username/UUID provided is invalid! The username cannot contain invalid characters. UUIDs must match the following regex: `/^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89AB][0-9a-f]{3}[0-9a-f]{12}$/i`. You can test this regex with [__this__](https://regex101.com/r/A866mm/1) site.',
            },
            notFound: {
                title: 'Not Found',
                description: "That %{inputType}% doesn't seem to be valid. Check to see if you spelt it wrong.",
            },
            unlinked: {
                title: 'Unlinked Account',
                description: 'You have not linked your Discord account to your Minecraft account on Hypixel! Follow the guide below. If you just linked it, please wait a few minutes and try again.',
            },
            mismatched: {
                title: 'Mismatched Tag',
                description: 'That Minecraft account currently has a different Discord account linked! If that is your account, follow the guide below to relink it. If you just relinked linked it, please wait a few minutes and try again.',
            },
            title: 'Registered',
            description: 'Registered successfully! You can now add modules with /modules.',
            field: {
                name: 'Next Steps',
                value: '/help • See information about any command or about this bot\n/language • Set a language for this bot',
            },
        },
        system: {
            embed: {
                title: 'System',
                field1: {
                    name: 'Uptime',
                    value: '%{uptime}%',
                },
                field2: {
                    name: 'Memory Usage',
                    value: '%{memoryMegaBytes}%MB',
                },
                field3: {
                    name: 'Servers',
                    value: '%{servers}%',
                },
                field4: {
                    name: 'Users',
                    value: '%{users}%',
                },
                field5: {
                    name: 'Registered Users',
                    value: '%{registeredUsers}%',
                },
                field6: {
                    name: 'Hypixel API',
                    value: 'Fetches: %{instanceUses}%\nRefresh Interval: %{updateInterval}%',
                },
            },
        },
    },
    errors: {
        commandErrors: {
            embed: {
                title: 'Oops',
                description: 'An error occurred while executing the command /%{commandName}%! This error has been automatically forwarded for review. It should be resolved soon. Sorry.',
                field: {
                    name: 'Interaction ID',
                    value: '%{id}%',
                },
            },
        },
        constraintErrors: {
            blockedUsers: {
                title: 'Blocked User',
                description: 'You were blocked from using this bot. You cannot appeal this.',
            },
            devMode: {
                title: 'Developer Mode',
                description: 'This bot is in developer only mode, likely due to a major issue or an upgrade that is taking place. Please check back later!',
            },
            owner: {
                title: 'Insufficient Permissions',
                description: 'You cannot execute this command without being an owner!',
            },
            dm: {
                title: 'DM Channel',
                description: 'You cannot execute this command in the DM channel! Please switch to a server channel!',
            },
            cooldown: {
                embed1: {
                    title: 'Cooldown',
                    description: 'You are executing commands too quickly! This cooldown of this command is %{cooldown}% seconds. This message will turn green in %{timeLeft}% seconds once the cooldown expires.',
                },
                embed2: {
                    title: 'Cooldown Over',
                    description: 'The cooldown has expired! You can now execute the command /%{commandName}%!',
                },
            },
        },
        moduleErrors: {
            10003: {
                name: '%{cleanModule}% Module Disabled',
                value: 'The %{cleanModule}% module was disabled because the set channel was not fetchable. [Code 10003](https://discord.com/developers/docs/topics/opcodes-and-status-codes#json "Opcodes and Status codes")',
            },
            10013: {
                name: '%{cleanModule}% Module Disabled',
                value: 'The %{cleanModule}% module was disabled because your account was not fetchable. [Code 10013](https://discord.com/developers/docs/topics/opcodes-and-status-codes#json "Opcodes and Status codes")',
            },
            50001: {
                name: '%{cleanModule}% Module Disabled',
                value: 'The %{cleanModule}% module was disabled because the set channel, server, or user was not reachable. Please check to see if this bot can access the set channel. [Code 50001](https://discord.com/developers/docs/topics/opcodes-and-status-codes#json "Opcodes and Status codes")',
            },
            50007: {
                name: '%{cleanModule}% Module Disabled',
                value: 'The %{cleanModule}% module was disabled because the bot was unable to DM you. Please check your privacy settings and enable direct messages. Then, reenable this module with /modules. [Code 50007](https://discord.com/developers/docs/topics/opcodes-and-status-codes#json "Opcodes and Status codes")',
            },
            50013: {
                name: '%{cleanModule}% Module Disabled',
                value: 'The %{cleanModule}% module was disabled because the bot lacked permission(s) to perform an action. Discord does not specify the missing permission(s), so this is all we know. [Code 50013](https://discord.com/developers/docs/topics/opcodes-and-status-codes#json "Opcodes and Status codes")',
            },
        },
        systemMessages: {
            embed: {
                title: 'System Message',
                description: 'This message is part of this bot\'s automatic mailbox system. These system messages are queued when the bot requires your attention and are sent when you execute a command.',
                footer: 'System Message',
            },
            failedDM: ' Your direct messages were disabled, so this message was sent here instead.',
        },
    },
    modules: {
        defender: {
            gameType: {
                name: 'Blacklisted Game Change Detected',
                value: 'Your account changed games from %{sGameType}% to %{pGameType}%',
                null: 'None',
            },
            login: {
                name: 'Login Detected',
                value: 'Your account logged in %{relative}% at %{time}%',
            },
            logout: {
                name: 'Logout Detected',
                value: 'Your account logged out %{relative}% at %{time}%',
            },
            language: {
                name: 'Language Change Detected',
                value: 'Your language changed from %{sLanguage}% to %{pLanguage}%',
            },
            version: {
                name: 'Version Change Detected',
                value: 'Your version changed from %{sVersion}% to %{pVersion}%',
            },
            embed: {
                title: 'Alert',
            },
            missingPermissions: {
                name: 'Defender Module Disabled',
                value: 'The Defender module was disabled because this bot is missing the following permission(s) in the channel %{channel}%: %{missingPermissions}%.',
            },
        },
        friends: {
            missingData: {
                title: 'Missing Data',
                description: 'Your last login and/or last logout data returned undefined for the Friend module. Login and logout notifications are now disabled. This may be a result of disabling the `Online` API option on Hypixel or setting your social status to offline. Notifications will resume and you will receive another DM once this data is no longer missing.',
                footer: 'Issue',
            },
            receivedData: {
                title: 'Received Data',
                description: 'Your last login and/or last logout data is no longer undefined for the Friend module. Login and logout notifications will now resume.',
                footer: 'Notification',
            },
            missingPermissions: {
                name: 'Friend Module Disabled',
                value: 'The Friends module was disabled because this bot is missing the following permission(s) in the channel %{channel}%: %{missingPermissions}%.',
            },
            suppressNext: {
                title: 'Alert Suppressed',
                description: 'Your latest alert for the Friend Module has been suppressed, and login/logout notifications will now resume.',
                footer: 'Notification',
            },
            login: {
                description: '%{mention}% logged in %{relative}% at %{time}%',
            },
            logout: {
                description: '%{mention}% logged out %{relative}% at %{time}%',
            },
        },
        rewards: {
            claimedNotification: {
                title: 'Daily Reward Claimed',
                description: 'You now have a daily streak of %{rewardScore}% with %{totalDailyRewards}% total daily rewards!',
                footer: 'Notification',
            },
            milestone: {
                title: 'Congratulations',
                description: '🎉 You have reached a daily streak of %{milestone}%!',
                footer: 'Notification',
            },
            rewardReminder: {
                title: 'Daily Reward Reminder',
                footer: 'Notification',
                description: [
                    "You haven't claimed your daily reward yet!",
                    "This is a reminder to claim your daily reward as it appears you haven't claimed it!",
                    'It appears that you have not claimed your daily reward yet!',
                    'You should go collect your daily reward!',
                    'Go claim your daily reward!',
                    'Your daily reward is waiting for you!',
                    'It is time to go claim your daily reward!',
                    'Your daily reward awaits collection!',
                    'Your daily reward is waiting!',
                ],
            },
        },
    },
};