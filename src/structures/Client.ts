import { config as Config, PrismaClient } from '@prisma/client';
import { container, SapphireClient } from '@sapphire/framework';
import { Intents, Options, type PresenceData, Sweepers } from 'discord.js';
import { join } from 'node:path';
import { Core } from '../core/Core';
import { i18n } from '../locales/i18n';
import { ModuleStore } from './ModuleStore';

export class Client extends SapphireClient {
    public constructor() {
        super({
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
            loadDefaultErrorListeners: false,
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
    }

    public async init() {
        const startTime = Date.now();

        container.stores.register(
            new ModuleStore().registerPath(join(__dirname, '..', 'modules')),
        );

        container.database = new PrismaClient();
        container.core = new Core();
        container.customPresence = null;
        container.i18n = new i18n();

        const { config } = container.database;

        container.config = (await config.findFirst()) as Config;

        container.logger.info(`${this.constructor.name}:`, 'Fetched config from the database.');

        const endTime = Date.now();

        const initTime = endTime - startTime;

        container.logger.info(
            `${this.constructor.name}:`,
            `Initialized container after ${initTime}ms.`,
        );

        await this.login();
    }
}

declare module '@sapphire/pieces' {
    interface Container {
        config: Config;
        core: Core;
        customPresence: PresenceData | null;
        database: PrismaClient;
        i18n: i18n;
    }

    interface StoreRegistryEntries {
        modules: ModuleStore;
    }
}
