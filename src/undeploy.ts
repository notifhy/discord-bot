import 'dotenv/config';
import process from 'node:process';
import { REST } from '@discordjs/rest';
import { PrismaClient } from '@prisma/client';
import { Routes } from 'discord-api-types/v10';

(async () => {
    try {
        const clientId = process.env.DISCORD_CLIENT_ID!;
        const token = process.env.DISCORD_TOKEN!;
        const database = new PrismaClient();
        const guildIds = (await database.config.findFirstOrThrow()).ownerGuilds;

        const rest = new REST({ version: '10' }).setToken(token);

        const body = {
            body: [],
        };

        await Promise.all([
            rest.put(Routes.applicationCommands(clientId), body),
            ...guildIds.map(
                (guildId) => rest.put(Routes.applicationGuildCommands(clientId, guildId), body),
            ),
        ]);

        console.log('Successfully un-deployed!');
    } catch (error) {
        console.error(error);
    }
})();
