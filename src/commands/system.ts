import type {
    CommandExecute,
    CommandProperties,
} from '../@types/client';
import type { UserAPIData } from '../@types/database';
import {
    BetterEmbed,
    cleanLength,
    cleanRound,
} from '../util/utility';
import { CommandInteraction } from 'discord.js';
import { keyLimit } from '../../config.json';
import { RegionLocales } from '../../locales/localesHandler';
import { SQLite } from '../util/SQLite';
import Constants from '../util/errors/Constants';
import process from 'node:process';

export const properties: CommandProperties = {
    name: 'system',
    description: 'View system information to satiate the curious',
    usage: '/system',
    cooldown: 10000,
    ephemeral: true,
    noDM: false,
    ownerOnly: false,
    structure: {
        name: 'system',
        description: 'View system information to satiate the curious',
    },
};

export const execute: CommandExecute = async (
    interaction: CommandInteraction,
    { userData },
): Promise<void> => {
    const locale = RegionLocales.locale(userData.language).commands.system;
    const { replace } = RegionLocales;

    const { instance } = interaction.client.hypixelAPI;

    const memoryMegaBytes =
        process.memoryUsage.rss() / (2 ** 20);

    const keyQueryLimit =
        keyLimit * instance.keyPercentage;

    const intervalBetweenRequests =
        (60 / keyQueryLimit) * Constants.ms.second;

    const registeredUsers = (
        await SQLite.getAllUsers<UserAPIData>({
            table: Constants.tables.api,
            columns: ['modules'],
        })
    ).filter(user => user.modules.length > 0);

    const userCount = registeredUsers.length;

    const updateInterval =
        registeredUsers.length * intervalBetweenRequests;

    const responseEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(locale.embed.title)
        .addFields([
            {
                name: locale.embed.field1.name,
                value: replace(locale.embed.field1.value, {
                    uptime: cleanLength(process.uptime() * 1000)!,
                }),
            },
            {
                name: locale.embed.field2.name,
                value: replace(locale.embed.field2.value, {
                    memoryMegaBytes: cleanRound(memoryMegaBytes, 1),
                }),
            },
            {
                name: locale.embed.field3.name,
                value: replace(locale.embed.field3.value, {
                    servers: interaction.client.guilds.cache.size,
                }),
            },
            {
                name: locale.embed.field4.name,
                value: replace(locale.embed.field4.value, {
                    users: interaction.client.guilds.cache.reduce(
                        (acc, guild) => acc + guild.memberCount,
                        0,
                    ),
                }),
            },
            {
                name: locale.embed.field5.name,
                value: replace(locale.embed.field5.value, {
                    registeredUsers: userCount,
                }),
            },
            {
                name: locale.embed.field6.name,
                value: replace(locale.embed.field6.value, {
                    instanceUses: instance.instanceUses,
                    updateInterval: cleanLength(updateInterval)!,
                }),
            },
        ]);

    await interaction.editReply({
        embeds: [responseEmbed],
    });
};
