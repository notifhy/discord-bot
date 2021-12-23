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
        },
        help: {
            information: {
                title: 'Information',
                description: 'placeholder',
            },
            all: {
                title: 'Commands',
                description: 'Arguments in brackets are required. Arguments in arrows are sometimes required based on the previous argument. You can use the command /help [command] [a command] to see more about a specific command.',
                field: {
                    name: '**%{commandUsage}%**',
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
                usage: {
                    name: 'Usage',
                    value: '%{commandUsage}%',
                },
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
                description: 'You can add or remove modules here. See more about a module by selecting it. Then, press the button to remove or add it. If you want to delete some or all of your data used by or associated with this bot, you can request it with /deletedata.',
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
                                    description: '18 hours before the next daily reset (2 AM EST)',
                                },
                                {
                                    label: '23 hours',
                                    value: '82800000',
                                    description: '23 hours before the next daily reset (1 AM EST)',
                                },
                            ],
                        },
                    },
                    notificationInterval: {
                        label: 'Notification Interval',
                        description: 'Set the timeout between pings',
                        longDescription: 'Set how long the bot should wait before pinging you again.',
                        value: 'notificationInterval',
                        emoji: Constants.emoji.loop,
                        select: {
                            customId: 'notificationInterval',
                            placeholder: 'Select a time',
                            disabled: false,
                            options: [
                                {
                                    label: '10 minutes',
                                    value: '600000',
                                },
                                {
                                    label: '15 minutes',
                                    value: '900000',
                                },
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
    },
    constraints: {
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
    modules: {
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
                title: 'Missing Permissions',
                description: 'This bot is missing the following permissions in the channel <#%{channelID}%>: %{missingPermissions}%. The Friends Module has been toggled off due to this issue.',
                footer: 'Issue',
            },
            suppressNext: {
                title: 'Alert Suppressed',
                description: 'Your latest alert for the Friend Module has been suppressed, and login/logout notifications will now resume.',
                footer: 'Notification',
            },
            login: {
                description: '<@!%{discordID}%> logged in <t:%{unixEpoch}%:R> at <t:%{unixEpoch}%:T>',
            },
            logout: {
                description: '<@!%{discordID}%> logged out <t:%{unixEpoch}%:R> at <t:%{unixEpoch}%:T>',
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
                description: '🎉 You have reached a daily streak of %{milestone}%! To opt out of future milestone messages, uae /modules',
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