import type {
    ClientCommand,
    Config,
} from '../@types/client';
import { BetterEmbed } from '../util/utility';
import {
    CommandInteraction,
    WebhookEditMessageOptions,
} from 'discord.js';
import { Log } from '../util/Log';
import { SQLite } from '../util/SQLite';
import Constants from '../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'config',
    description: 'Configure the bot',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
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
    interaction: CommandInteraction,
): Promise<void> => {
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
            interaction.client.config.enabled = Boolean(config.enabled);

        const apiEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(`API State Updated!`)
            .setDescription(
                `API commands and functions are now ${
                    config.enabled === true ? 'on' : 'off'
                }!`,
            );

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
                .setTitle(`Guild Added`)
                .setDescription(`${guildID} was added to the blacklist!`);

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
                .setTitle(`Guild Removed`)
                .setDescription(
                    `${guildID} was removed from the blacklist!`,
                );

            payload.embeds = [guildEmbed];
        }

        payload.embeds = [guildEmbed];

        interaction.client.config.blockedGuilds = config.blockedGuilds;

        Log.command(interaction, guildEmbed.description);
    }

    function blockUserCommand() {
        const user = interaction.options.getString('user', true);
        const blockedUserIndex = config.blockedUsers.indexOf(user);

        const userEmbed = new BetterEmbed(interaction)
                .setColor(Constants.colors.normal);

        if (blockedUserIndex === -1) {
            config.blockedUsers.push(user);

            userEmbed
                .setTitle(`User Added`)
                .setDescription(`${user} was added to the blacklist!`);
        } else {
            config.blockedUsers.splice(blockedUserIndex, 1);

            userEmbed
                .setTitle(`User Removed`)
                .setDescription(`${user} was removed from the blacklist!`);
        }

        payload.embeds = [userEmbed];

        interaction.client.config.blockedUsers = config.blockedUsers;

        Log.command(interaction, userEmbed.description);
    }

    function devModeCommand() {
        config.devMode = !config.devMode;
        interaction.client.config.devMode = config.devMode;

        const devmodeEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(`Developer Mode Updated`)
            .setDescription(
                `Developer Mode is now ${
                    config.devMode ? 'on' : 'off'
                }!`,
            );

        payload.embeds = [devmodeEmbed];

        Log.command(interaction, devmodeEmbed.description);
    }

    const newRawConfig = SQLite.unJSONize({ ...config });

    await SQLite.queryRun({
        query: 'UPDATE config set blockedGuilds = ?, blockedUsers = ?, devMode = ?, enabled = ? WHERE rowid = 1',
        data: Object.values(newRawConfig),
    });

    await interaction.editReply(payload);
};
