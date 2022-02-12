import type { ClientCommand } from '../@types/client';
import type { UserAPIData } from '../@types/database';
import {
    BetterEmbed,
    cleanLength,
    cleanRound,
} from '../../util/utility';
import { Constants } from '../util/Constants';
import { GlobalConstants } from '../../util/Constants';
import { keyLimit } from '../../../config.json';
import { RegionLocales } from '../locales/RegionLocales';
import { SQLite } from '../../util/SQLite';
import process from 'node:process';

export const properties: ClientCommand['properties'] = {
    name: 'system',
    description: 'View system information.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'system',
        description: 'View system information',
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const text = RegionLocales.locale(locale).commands.system;
    const { replace } = RegionLocales;

    const { request } = interaction.client.hypixel;

    const memoryMegaBytes =
        process.memoryUsage.rss() / (2 ** 20);

    const keyQueryLimit =
        keyLimit * request.keyPercentage;

    const intervalBetweenRequests =
        (60 / keyQueryLimit) * GlobalConstants.ms.second;

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
        .setTitle(text.embed.title)
        .addFields(
            {
                name: text.embed.field1.name,
                value: replace(text.embed.field1.value, {
                    uptime: cleanLength(process.uptime() * 1000)!,
                }),
            },
            {
                name: text.embed.field2.name,
                value: replace(text.embed.field2.value, {
                    memoryMegaBytes: cleanRound(memoryMegaBytes, 1),
                }),
            },
            {
                name: text.embed.field3.name,
                value: replace(text.embed.field3.value, {
                    servers: interaction.client.guilds.cache.size,
                }),
            },
            {
                name: text.embed.field4.name,
                value: replace(text.embed.field4.value, {
                    users: interaction.client.guilds.cache.reduce(
                        (acc, guild) => acc + guild.memberCount,
                        0,
                    ),
                }),
            },
            {
                name: text.embed.field5.name,
                value: replace(text.embed.field5.value, {
                    registeredUsers: userCount,
                }),
            },
            {
                name: text.embed.field6.name,
                value: replace(text.embed.field6.value, {
                    uses: request.uses,
                    updateInterval: cleanLength(updateInterval)!,
                }),
            },
        );

    await interaction.editReply({
        embeds: [responseEmbed],
    });
};