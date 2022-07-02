import {
    Client,
    Collection,
    Intents,
    Options,
    Sweepers,
} from 'discord.js';
import fs from 'node:fs/promises';
import process from 'node:process';
import type {
    ClientCommand,
    ClientEvent,
    Config,
} from './@types/client';
import type { ClientModule } from './@types/modules';
import { Core } from './core/core';
import { discordAPIkey } from '../../config.json';
import { ErrorHandler } from './errors/ErrorHandler';
import { Log } from './utility/Log';
import { SQLite } from './utility/SQLite';

process.on('exit', (code) => {
    Log.log(`Exiting with code ${code}`);
    SQLite.close();
});

process.on('unhandledRejection', async (error) => {
    Log.error('unhandledRejection');
    await ErrorHandler.init(error);
    process.exit(1);
});

process.on('uncaughtException', async (error) => {
    Log.error('uncaughtException');
    await ErrorHandler.init(error);
    process.exit(1);
});

const client = new Client({
    allowedMentions: {
        parse: ['users'],
        repliedUser: true,
    },
    failIfNotExists: false,
    intents: [Intents.FLAGS.GUILDS],
    makeCache: Options.cacheWithLimits({
        GuildBanManager: 0,
        GuildInviteManager: 0,
        GuildMemberManager: 25,
        GuildEmojiManager: 0,
        GuildScheduledEventManager: 0,
        GuildStickerManager: 0,
        MessageManager: 50,
        PresenceManager: 0,
        ReactionManager: 0,
        ReactionUserManager: 0,
        StageInstanceManager: 0,
        ThreadManager: 0,
        ThreadMemberManager: 0,
        VoiceStateManager: 0,
    }),
    retryLimit: 5,
    presence: {
        status: 'online',
    },
    sweepers: {
        guildMembers: {
            interval: 600,
            filter: Sweepers.filterByLifetime({
                lifetime: 60,
            }),
        },
        messages: {
            interval: 600,
            lifetime: 60,
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
        users: {
            interval: 3600,
            filter: Sweepers.filterByLifetime({
                lifetime: 3600,
            }),
        },
    },
});

SQLite.key();
SQLite.createTablesIfNotExists();

client.commands = new Collection();
client.config = SQLite.queryGet<Config>({
    query: 'SELECT * FROM config WHERE rowid = 1',
    allowUndefined: false,
});
client.cooldowns = new Collection();
client.core = new Core(client);
client.customPresence = null;
client.events = new Collection();
client.modules = new Collection();

(async () => {
    const folders = (
        await Promise.all([
            fs.readdir(`${__dirname}/commands`),
            fs.readdir(`${__dirname}/events`),
            fs.readdir(`${__dirname}/modules`),
        ])
    ).map((file) => file.filter((file1) => file1.endsWith('.ts')));

    const commandPromises: Promise<ClientCommand>[] = [];
    const eventPromises: Promise<ClientEvent>[] = [];
    const modulePromises: Promise<ClientModule>[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const file of folders[0]) {
        commandPromises.push(import(`${__dirname}/commands/${file}`));
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const file of folders[1]) {
        eventPromises.push(import(`${__dirname}/events/${file}`));
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const file of folders[2]) {
        modulePromises.push(import(`${__dirname}/modules/${file}`));
    }

    const resolvedPromises = await Promise.all([
        Promise.all(commandPromises),
        Promise.all(eventPromises),
        Promise.all(modulePromises),
    ]);

    // eslint-disable-next-line no-restricted-syntax
    for (const command of resolvedPromises[0]) {
        client.commands.set(command.properties.name, command);
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const event of resolvedPromises[1]) {
        client.events.set(event.properties.name, event);
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const module of resolvedPromises[2]) {
        client.modules.set(module.properties.name, module);
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const {
        properties: { name, once },
    } of client.events.values()) {
        const execute = (...parameters: unknown[]) => {
            client.events.get(name)!.execute(...parameters);
        };

        if (once === false) {
            client.on(name, execute);
        } else {
            client.once(name, execute);
        }
    }

    await client.login(discordAPIkey);
})();