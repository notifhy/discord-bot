import { type WebhookEditMessageOptions } from 'discord.js';
import {
    type ClientCommand,
    type Config,
} from '../@types/client';
import { RegionLocales } from '../locales/RegionLocales';
import { Constants } from '../utility/Constants';
import { Log } from '../utility/Log';
import { SQLite } from '../utility/SQLite';
import { BetterEmbed } from '../utility/utility';

export const properties: ClientCommand['properties'] = {
    name: 'config',
    description: 'Configure the bot.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'config',
        description: 'Toggles dynamic settings',
        options: [
            {
                name: 'blockguild',
                description: 'Blacklists the bot from joining specific guilds',
                type: 1,
                options: [
                    {
                        name: 'guild',
                        type: 3,
                        description: "The guild's ID",
                        required: true,
                    },
                ],
            },
            {
                name: 'blockuser',
                description: 'Blacklists users from using this bot',
                type: 1,
                options: [
                    {
                        name: 'user',
                        type: 3,
                        description: "The user's ID",
                        required: true,
                    },
                ],
            },
            {
                name: 'core',
                type: 1,
                description: 'Toggle the core',
            },
            {
                name: 'devmode',
                type: 1,
                description: 'Toggle Developer Mode',
            },
            {
                name: 'keypercentage',
                description: 'Set how much of the Hypixel API key should be used',
                type: 1,
                options: [
                    {
                        name: 'percentage',
                        type: 10,
                        description: 'The percentage as a decimal',
                        required: true,
                        minValue: 0.01,
                        maxValue: 1,
                    },
                ],
            },
            {
                name: 'restrequesttimeout',
                description: 'Set the request timeout before an abort error is thrown',
                type: 1,
                options: [
                    {
                        name: 'milliseconds',
                        type: 4,
                        description: 'The timeout in milliseconds',
                        required: true,
                        minValue: 0,
                        maxValue: 100000,
                    },
                ],
            },
            {
                name: 'retrylimit',
                description: 'Set the number of request retries before throwing',
                type: 1,
                options: [
                    {
                        name: 'limit',
                        type: 4,
                        description: 'The number of retries',
                        required: true,
                        minValue: 0,
                        maxValue: 100,
                    },
                ],
            },
            {
                name: 'view',
                description: 'View the current configuration',
                type: 1,
            },
        ],
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const text = RegionLocales.locale(locale).commands.config;
    const { replace } = RegionLocales;

    const config = SQLite.queryGet<Config>({
        query: 'SELECT blockedGuilds, blockedUsers, core, devMode, keyPercentage, restRequestTimeout, retryLimit FROM config WHERE rowid = 1',
    });

    const payload: WebhookEditMessageOptions = {};

    switch (interaction.options.getSubcommand()) {
        case 'blockguild': await blockGuildCommand();
            break;
        case 'blockuser': blockUserCommand();
            break;
        case 'core': coreCommand();
            break;
        case 'devmode': devModeCommand();
            break;
        case 'keypercentage': keyPercentageCommand();
            break;
        case 'restrequesttimeout': restRequestTimeoutCommand();
            break;
        case 'retrylimit': retryLimitCommand();
            break;
        case 'view': viewCommand();
            break;
        // no default
    }

    async function blockGuildCommand() {
        const guildID = interaction.options.getString('guild', true);
        const blockedGuildIndex = config.blockedGuilds.indexOf(guildID);

        const guildEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal);

        if (blockedGuildIndex === -1) {
            config.blockedGuilds.push(guildID);

            const guild = await interaction.client.guilds.fetch(guildID);
            await guild.leave();

            guildEmbed
                .setTitle(text.blockGuild.add.title)
                .setDescription(replace(text.blockGuild.add.description, {
                    guildID: guildID,
                }));

            payload.files = [
                {
                    attachment: Buffer.from(JSON.stringify(guild, null, 2)),
                    name: 'guild.json',
                },
            ];

            Log.interaction(interaction, guildEmbed.description);
        } else {
            config.blockedGuilds.splice(blockedGuildIndex, 1);

            guildEmbed
                .setTitle(text.blockGuild.remove.title)
                .setDescription(replace(text.blockGuild.remove.description, {
                    guildID: guildID,
                }));

            payload.embeds = [guildEmbed];
        }

        payload.embeds = [guildEmbed];

        interaction.client.config.blockedGuilds = config.blockedGuilds;

        Log.interaction(interaction, guildEmbed.description);
    }

    function blockUserCommand() {
        const userID = interaction.options.getString('user', true);
        const blockedUserIndex = config.blockedUsers.indexOf(userID);

        const userEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal);

        if (blockedUserIndex === -1) {
            config.blockedUsers.push(userID);

            userEmbed
                .setTitle(text.blockUser.remove.title)
                .setDescription(replace(text.blockUser.remove.description, {
                    userID: userID,
                }));
        } else {
            config.blockedUsers.splice(blockedUserIndex, 1);

            userEmbed
                .setTitle(text.blockUser.remove.title)
                .setDescription(replace(text.blockUser.remove.description, {
                    userID: userID,
                }));
        }

        payload.embeds = [userEmbed];

        interaction.client.config.blockedUsers = config.blockedUsers;

        Log.interaction(interaction, userEmbed.description);
    }

    function coreCommand() {
        config.core = !config.core;
        interaction.client.config.core = config.core;

        const coreEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(text.core.title)
            .setDescription(replace(text.core.description, {
                state: config.core === true
                    ? text.on
                    : text.off,
            }));

        payload.embeds = [coreEmbed];

        Log.interaction(interaction, coreEmbed.description);
    }

    function devModeCommand() {
        config.devMode = !config.devMode;
        interaction.client.config.devMode = config.devMode;

        const devModeEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(text.devMode.title)
            .setDescription(replace(text.devMode.description, {
                state: config.devMode === true
                    ? text.on
                    : text.off,
            }));

        payload.embeds = [devModeEmbed];

        Log.interaction(interaction, devModeEmbed.description);
    }

    function keyPercentageCommand() {
        const percentage = interaction.options.getNumber('percentage', true);
        config.keyPercentage = percentage;
        interaction.client.config.keyPercentage = percentage;

        const keyPercentageEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(text.keyPercentage.title)
            .setDescription(replace(text.keyPercentage.description, {
                percentage: percentage,
            }));

        payload.embeds = [keyPercentageEmbed];

        Log.interaction(interaction, keyPercentageEmbed.description);
    }

    function restRequestTimeoutCommand() {
        const milliseconds = interaction.options.getInteger('milliseconds', true);
        config.restRequestTimeout = milliseconds;
        interaction.client.config.restRequestTimeout = milliseconds;

        const keyPercentageEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(text.restRequestTimeout.title)
            .setDescription(replace(text.restRequestTimeout.description, {
                milliseconds: milliseconds,
            }));

        payload.embeds = [keyPercentageEmbed];

        Log.interaction(interaction, keyPercentageEmbed.description);
    }

    function retryLimitCommand() {
        const limit = interaction.options.getInteger('limit', true);
        config.retryLimit = limit;
        interaction.client.config.retryLimit = limit;

        const keyPercentageEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(text.retryLimit.title)
            .setDescription(replace(text.retryLimit.description, {
                limit: limit,
            }));

        payload.embeds = [keyPercentageEmbed];

        Log.interaction(interaction, keyPercentageEmbed.description);
    }

    function viewCommand() {
        const viewEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(text.view.title)
            .setDescription(replace(text.view.description, {
                blockedGuilds: config.blockedGuilds.join(', '),
                blockedUsers: config.blockedUsers.join(', '),
                core: config.core === true ? text.on : text.off,
                devMode: config.devMode === true ? text.on : text.off,
                keyPercentage: config.keyPercentage * 100,
                restRequestTimeout: config.restRequestTimeout,
                retryLimit: config.retryLimit,
            }));

        payload.embeds = [viewEmbed];
    }

    const newRawConfig = SQLite.unjsonize({ ...config });

    SQLite.queryRun({
        query: 'UPDATE config set blockedGuilds = ?, blockedUsers = ?, core = ?, devMode = ?, keyPercentage = ?, restRequestTimeout = ?, retryLimit = ? WHERE rowid = 1',
        data: Object.values(newRawConfig),
    });

    await interaction.editReply(payload);
};