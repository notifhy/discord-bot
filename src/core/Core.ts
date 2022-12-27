import type { modules as ModulesType, users as User } from '@prisma/client';
import type { Collection } from 'discord.js';
import cron, { ScheduledTask } from 'node-cron';
import { CoreErrors } from './CoreErrors';
import { ErrorHandler } from '../errors/ErrorHandler';
import { Base } from '../structures/Base';
import type { Module, ModuleOptions } from '../structures/Module';
import { Modules } from '../structures/Modules';
import { Logger } from '../structures/Logger';

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
            if (this.errors.isTimeout()) {
                return;
            }

            await this.refresh();
        } catch (error) {
            new ErrorHandler(error).init();
        }
    }

    private async refresh() {
        const users = await this.container.database.users.findMany({
            include: {
                modules: true,
            },
        });

        const moduleStore = this.container.stores.get('modules');
        const modulesWithCron = moduleStore.filter((module) => module.cron);

        // eslint-disable-next-line no-restricted-syntax
        for (const user of users) {
            await this.refreshUser(user, modulesWithCron);
        }
    }

    private async refreshUser(
        user: User & {
            modules: ModulesType;
        },
        modulesWithCron: Collection<string, Module<ModuleOptions>>,
    ) {
        if (this.errors.isTimeout() || this.container.config.core === false) {
            return;
        }

        try {
            const enabledModules = modulesWithCron.filter((module) => user.modules[module.name]);

            if (enabledModules.size > 0) {
                await Modules.executeModules(user, enabledModules);
            } else {
                this.container.logger.debug(
                    this,
                    Logger.moduleContext(user),
                    'User has no enabled modules.',
                );
            }
        } catch (error) {
            this.errors.addGeneric();
            new ErrorHandler(error).init();
        }
    }
}
