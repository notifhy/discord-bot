import { config as Config, PrismaClient } from '@prisma/client';
import { container, SapphireClient } from '@sapphire/framework';
import { Intents, Options, type PresenceData, Sweepers } from 'discord.js';
import { join } from 'node:path';
import { Core } from '../core/Core';
import { i18n } from '../locales/i18n';
import { ModuleStore } from './ModuleStore';

export class Client extends SapphireClient {
    public constructor(config: Config) {
        super({
            allowedMentions: {
                parse: ['users'],
                repliedUser: true,
            },
            failIfNotExists: false,
            intents: [Intents.FLAGS.GUILDS],
            loadDefaultErrorListeners: false,
            logger: {
                level: config.logLevel,
            },
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

    public static async init() {
        const startTime = Date.now();

        container.database = new PrismaClient();

        container.config = (await container.database.config.findFirst()) as Config;
        container.core = new Core();
        container.customPresence = null;
        container.i18n = new i18n();

        await new Client(container.config).login();

        container.stores.register(
            new ModuleStore().registerPath(join(__dirname, '..', 'modules')),
        );

        container.logger.info(
            `${this.constructor.name}:`,
            `Initialized container after ${Date.now() - startTime}ms.`,
        );
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
