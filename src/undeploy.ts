import 'dotenv/config';
import process from 'node:process';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

(async () => {
    try {
        const rest = new REST({ version: '10' })
            .setToken(process.env.DISCORD_TOKEN!);

        const guildIds = ['873000534955667496'];

        await Promise.all([
            rest.put(
                Routes.applicationCommands(
                    process.env.DISCORD_CLIENT_ID!,
                ), {
                    body: [],
                },
            ),
            ...guildIds.map((guildId) => rest.put(
                Routes.applicationGuildCommands(
                    process.env.DISCORD_CLIENT_ID!,
                    guildId,
                ), {
                    body: [],
                },
            )),
        ]);

        console.log('Successfully un-deployed!');
    } catch (error) {
        console.error(error);
    }
})();