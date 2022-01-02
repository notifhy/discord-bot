import type { ClientCommand, ClientEvent, Config } from './@types/client';
import type { ClientModule } from './@types/modules';
import { Client, Collection, Intents, Sweepers } from 'discord.js';
import { discordAPIkey } from '../config.json';
import { RequestManager } from './hypixelAPI/RequestManager';
import { SQLite } from './util/SQLite';
import ErrorHandler from './util/errors/handlers/ErrorHandler';
import fs from 'node:fs/promises';
import process from 'node:process';

process.on('exit', code => {
    console.warn(`Exiting with code ${code}`);
});

process.on('unhandledRejection', async error => {
    console.error('unhandledRejection', error);
    await new ErrorHandler(error).systemNotify();
    process.exit(0);
});

process.on('uncaughtException', async error => {
    console.error('uncaughtException', error);
    await new ErrorHandler(error).systemNotify();
    process.exit(0);
});

const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
    allowedMentions: {
        parse: ['users'],
        repliedUser: true,
    },
    presence: {
        status: 'dnd',
    },
    sweepers: {
        guildMembers: {
            interval: 600,
            filter: Sweepers.filterByLifetime({
                lifetime: 1,
            }),
        },
        messages: {
            interval: 600,
            lifetime: 30,
        },
        users: {
            interval: 3600,
            filter: Sweepers.filterByLifetime({
                lifetime: 3600,
            }),
        },
        threadMembers: {
            interval: 600,
            filter: Sweepers.filterByLifetime({
                lifetime: 1,
            }),
        },
        threads: {
            interval: 600,
            lifetime: 30,
        },
    },
});

client.commands = new Collection();
client.cooldowns = new Collection();
client.customStatus = null;
client.events = new Collection();
client.hypixelAPI = new RequestManager(client);
client.modules = new Collection();

(async () => {
    const folders = (
        await Promise.all([
            fs.readdir(`${__dirname}/commands`),
            fs.readdir(`${__dirname}/events`),
            fs.readdir(`${__dirname}/modules`),
        ])
    ).map(file => file.filter(file1 => file1.endsWith('.ts')));

    const commandPromises: Promise<ClientCommand>[] = [];
    const eventPromises: Promise<ClientEvent>[] = [];
    const modulePromises: Promise<ClientModule>[] = [];

    for (const file of folders[0]) {
        commandPromises.push(import(`${__dirname}/commands/${file}`));
    }

    for (const file of folders[1]) {
        eventPromises.push(import(`${__dirname}/events/${file}`));
    }

    for (const file of folders[2]) {
        modulePromises.push(import(`${__dirname}/modules/${file}`));
    }

    const resolvedPromises = await Promise.all([
        Promise.all(commandPromises),
        Promise.all(eventPromises),
        Promise.all(modulePromises),
    ]);

    for (const command of resolvedPromises[0]) {
        client.commands.set(command.properties.name, command);
    }

    for (const event of resolvedPromises[1]) {
        client.events.set(event.properties.name, event);
    }

    for (const module of resolvedPromises[2]) {
        client.modules.set(module.properties.name, module);
    }

    for (const {
        properties: { name, once },
    } of client.events.values()) {
        const execute = (...parameters: unknown[]) =>
            client.events.get(name)!.execute(...parameters);

        if (once === false) {
            client.on(name, execute);
        } else {
            client.once(name, execute);
        }
    }

    await SQLite.createTablesIfNotExists();

    const config = await SQLite.queryGet<Config>({
        query: 'SELECT * FROM config WHERE rowid = 1',
    });

    client.config = {
        blockedGuilds: config.blockedGuilds,
        blockedUsers: config.blockedUsers,
        devMode: config.devMode,
        enabled: config.enabled,
        uses: config.uses,
    };

    await client.login(discordAPIkey);
})();
