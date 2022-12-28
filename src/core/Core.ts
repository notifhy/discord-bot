import type { modules as ModulesType, users as User } from '@prisma/client';
import { Collection, DiscordAPIError } from 'discord.js';
import cron, { ScheduledTask } from 'node-cron';
import { CoreErrors } from './CoreErrors';
import { ErrorHandler } from '../errors/ErrorHandler';
import { Base } from '../structures/Base';
import type { Module, ModuleOptions } from '../structures/Module';
import { Modules } from '../structures/Modules';
import { Logger } from '../structures/Logger';
import { ModuleErrorHandler } from '../errors/ModuleErrorHandler';

/* eslint-disable no-await-in-loop */

export class Core extends Base {
    private cron: ScheduledTask;

    public readonly modules: Modules;

    public readonly errors: CoreErrors;

    constructor() {
        super();

        this.cron = cron.schedule(
            this.container.config.coreCron,
            async () => {
                await this.preconditions();
            },
            {
                scheduled: false,
            },
        );

        this.errors = new CoreErrors();
        this.modules = new Modules();

        this.container.logger.debug(this, `Cron scheduled with ${this.container.config.coreCron}.`);
    }

    public async init() {
        this.cron = cron.schedule(
            this.container.config.coreCron,
            async () => {
                await this.preconditions();
            },
            {
                scheduled: false,
            },
        );

        if (this.container.config.core) {
            this.cron.start();
        }
    }

    public cronStart() {
        this.cron.start();
    }

    public cronStop() {
        this.cron.stop();
    }

    private async preconditions() {
        try {
            if (this.errors.isTimeout() || this.container.config.core === false) {
                return;
            }

            await this.refresh();
        } catch (error) {
            new ErrorHandler(error).init();
        }
    }

    private async refresh() {
        // shuffle array?
        const users = await this.container.database.users.findMany({
            include: {
                modules: true,
            },
        });

        const moduleStore = this.container.stores.get('modules');
        const modulesWithCron = moduleStore.filter((module) => module.cron);

        // eslint-disable-next-line no-restricted-syntax
        for (const user of users) {
            if (this.errors.isTimeout() || this.container.config.core === false) {
                return;
            }

            await this.refreshUser(user, user.modules, modulesWithCron);
        }
    }

    private async refreshUser(
        user: User,
        modules: ModulesType,
        modulesWithCron: Collection<string, Module<ModuleOptions>>,
    ) {
        const activeModules = modulesWithCron.filter((module) => modules[module.name]);

        if (activeModules.size === 0) {
            this.container.logger.debug(
                this,
                Logger.moduleContext(user),
                'User has no enabled modules.',
            );
        } else {
            // eslint-disable-next-line no-restricted-syntax
            for (const module of activeModules.values()) {
                try {
                    await module.cron!(user);

                    this.container.logger.debug(
                        this,
                        Logger.moduleContext(user),
                        `Ran ${module.name}.`,
                    );
                } catch (error) {
                    await new ModuleErrorHandler(error, module, user).init();
                    if (!(error instanceof DiscordAPIError)) {
                        this.errors.addGeneric();
                        break;
                    }
                }
            }
        }
    }
}
