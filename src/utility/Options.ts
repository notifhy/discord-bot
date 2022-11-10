import { type Command, container, RegisterBehavior } from '@sapphire/framework';
import { PresenceUpdateStatus } from 'discord-api-types/v10';
import { type ColorResolvable, Constants, type PresenceData } from 'discord.js';
import { Time } from '../enums/Time';
import type { locales } from '../locales/locales';

export class Options {
    static readonly colorsError: ColorResolvable = 0xaa0000;

    static readonly colorsWarning: ColorResolvable = 0xff5555;

    static readonly colorsNormal: ColorResolvable = 0x2f3136;

    static readonly colorsOk: ColorResolvable = 0xffaa00;

    static readonly colorsOn: ColorResolvable = 0x00aa00;

    static readonly commandRegistry = (command: Command) => ({
        guildIds: command.options.preconditions?.find((condition) => condition === 'OwnerOnly')
            ? container.config.ownerGuilds
            : undefined,
        registerCommandIfMissing: true,
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
    });

    static readonly coreDisabledTimeout = Time.Second * 10;

    static readonly dataHistoryFast = 27;

    static readonly dataHistorySlow = 9;

    static readonly defaultLocale: keyof typeof locales = 'en-US';

    static readonly emojiFastBackward: '<:fastBackward:928525727035441175>';

    static readonly emojiFastForward: '<:fastForward:928525679509786665>';

    static readonly emojiSlowBackward = '<:backward:928525709004111892>';

    static readonly emojiSlowForward: '<:forward:928525657829412864>';

    static readonly modulesRewardsHypixelTimezone = 'EST5EDT';

    static readonly modulesRewardsMilestones = [
        7, 30, 60, 90, 100, 150, 200, 250, 300, 365, 500, 750, 1000,
    ];

    static readonly performanceInterval = Time.Hour / 2;

    static readonly performanceMaxDataPoints = 100;

    static readonly performanceHistory = 50;

    static readonly pingOkMinimum = 300;

    static readonly pingOnMinimum = 150;

    static readonly presence = (userCount: number, guildCOunt: number) => ({
        activities: [
            {
                name: `${userCount} accounts in ${guildCOunt} servers | /register /help`,
                type: Constants.ActivityTypes.WATCHING,
            },
        ],
        status: PresenceUpdateStatus.Online,
    }) as PresenceData;

    static readonly regexUsername = /^[a-zA-Z0-9_-]{1,24}$/;

    static readonly regexUUID = /^[0-9a-f]{8}(-?)[0-9a-f]{4}(-?)[1-5][0-9a-f]{3}(-?)[89AB][0-9a-f]{3}(-?)[0-9a-f]{12}$/i;

    static readonly restRequestTimeout = Time.Second * 5;

    static readonly retryLimit = 2;

    static readonly timeoutBaseTimeout = Time.Minute;

    static readonly timeoutMaxTimeout = Time.Day / 2;

    static readonly timeoutResetAfter = Time.Minute * 10;

    static readonly urlSlothpixelPlayer = 'https://api.slothpixel.me/api/players';

    static readonly urlHypixelDiscord = 'https://i.imgur.com/gGKd2s8.gif';

    static readonly urlHypixelPlayer = 'https://api.hypixel.net/player';

    static readonly urlHypixelStatus = 'https://api.hypixel.net/status';
}
