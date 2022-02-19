import type {
    ClientCommand,
    Config,
} from '../@types/client';
import { BetterEmbed } from '../../utility/utility';
import { Constants } from '../utility/Constants';
import { Log } from '../../utility/Log';
import { RegionLocales } from '../locales/RegionLocales';
import { SQLite } from '../../utility/SQLite';
import { WebhookEditMessageOptions } from 'discord.js';

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
                name: 'api',
                type: 1,
                description: 'Toggle API commands and functions',
            },
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
                name: 'devmode',
                type: 1,
                description: 'Toggle Developer Mode',
            },
        ],
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const text = RegionLocales.locale(locale).commands.config;
    const replace = RegionLocales.replace;

    const config = await SQLite.queryGet<Config>({
        query: 'SELECT blockedGuilds, blockedUsers, devMode, enabled FROM config WHERE rowid = 1',
    });

    const payload: WebhookEditMessageOptions = {};


    switch (interaction.options.getSubcommand()) {
        case 'api': apiCommand();
        break;
        case 'blockguild': await blockGuildCommand();
        break;
        case 'blockuser': blockUserCommand();
        break;
        case 'devmode': devModeCommand();
        break;
        //no default
    }

    function apiCommand() {
        config.enabled = !config.enabled;
        interaction.client.config.enabled = config.enabled;

        const apiEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(text.api.title)
            .setDescription(replace(text.api.description, {
                state: config.enabled === true
                    ? text.on
                    : text.off,
            }));

        payload.embeds = [apiEmbed];

        Log.command(interaction, apiEmbed.description);
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

            Log.command(interaction, guildEmbed.description);
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

        Log.command(interaction, guildEmbed.description);
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

        Log.command(interaction, userEmbed.description);
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

        Log.command(interaction, devModeEmbed.description);
    }

    const newRawConfig = SQLite.unJSONize({ ...config });

    await SQLite.queryRun({
        query: 'UPDATE config set blockedGuilds = ?, blockedUsers = ?, devMode = ?, enabled = ? WHERE rowid = 1',
        data: Object.values(newRawConfig),
    });

    await interaction.editReply(payload);
};