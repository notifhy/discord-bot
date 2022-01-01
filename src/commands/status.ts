import type { CommandExecute, CommandProperties } from '../@types/client';
import type { RawUserAPIData, UserAPIData } from '../@types/database';
import { BetterEmbed, cleanLength } from '../util/utility';
import { CommandInteraction } from 'discord.js';
import { keyLimit } from '../../config.json';
import { SQLiteWrapper } from '../database';
import Constants from '../util/Constants';
import process from 'node:process';

export const properties: CommandProperties = {
    name: 'status',
    description: "View the bot's status",
    usage: '/status',
    cooldown: 10000,
    ephemeral: true,
    noDM: false,
    ownerOnly: false,
    structure: {
        name: 'status',
        description: "View the bot's status",
    },
};

export const execute: CommandExecute = async (
    interaction: CommandInteraction,
): Promise<void> => {
    const { instance } = interaction.client.hypixelAPI;

    const keyQueryLimit =
        keyLimit * instance.keyPercentage;

    const intervalBetweenRequests =
        (60 / keyQueryLimit) * Constants.ms.second;

    const registeredUsers = (
        await SQLiteWrapper.getAllUsers<RawUserAPIData, UserAPIData>({
            table: Constants.tables.api,
            columns: ['modules'],
        })
    ).filter(user => user.modules.length > 0);

    const userCount = registeredUsers.length;

    const updateInterval =
        registeredUsers.length * intervalBetweenRequests;

    const {
        fetch: fetchPerformance,
        databaseFetch: databaseFetchPerformance,
        process: processPerformance,
        save: savePerformance,
        modules: modulePerformance,
    } = instance.performance.latest!;

    const responseEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle('Status')
        .addFields([
            {
                name: 'Uptime',
                value: String(
                    cleanLength(process.uptime() * 1000),
                ),
            },
            {
                name: 'Servers',
                value: String(
                    interaction.client.guilds.cache.size,
                ),
            },
            {
                name: 'Users',
                value: String(
                    interaction.client.guilds.cache.reduce(
                        (acc, guild) => acc + guild.memberCount,
                        0,
                    ),
                ),
            },
            {
                name: 'Registered Users',
                value: String(userCount),
            },
            {
                name: 'Hypixel API',
                value:
                `
                Instance Queries: ${
                    instance.instanceUses
                }
                Refresh Interval: ${cleanLength(
                    updateInterval,
                )}`,
            },
            {
                name: 'Latest Performance',
                value:
                `Hypixel API Fetch: ${
                    fetchPerformance
                }ms
                Database Fetch: ${
                    databaseFetchPerformance
                }ms
                Data Process: ${
                    processPerformance
                }ms
                Data Save: ${
                    savePerformance
                }ms
                Module Execution: ${
                    modulePerformance
                }ms
                Total: ${
                    fetchPerformance +
                    processPerformance +
                    savePerformance +
                    modulePerformance
                }ms`,
            },
        ]);

    await interaction.editReply({
        embeds: [responseEmbed],
    });
};
