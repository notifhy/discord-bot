import type { users as User } from '@prisma/client';
import type { Collection } from 'discord.js';
import cron, { ScheduledTask } from 'node-cron';
import { CoreErrors } from './CoreErrors';
import { CoreRequestErrorHandler } from '../errors/CoreRequestErrorHandler';
import { ErrorHandler } from '../errors/ErrorHandler';
import { HTTPError } from '../errors/HTTPError';
import { Base } from '../structures/Base';
import type { Module, ModuleOptions } from '../structures/Module';
import { Modules } from '../structures/Modules';
import { Performance } from '../structures/Performance';
import { Logger } from '../structures/Logger';

/* eslint-disable no-await-in-loop */

export class Core extends Base {
    private cron: ScheduledTask;

    public readonly modules: Modules;

    public readonly errors: CoreErrors;

    public readonly performance: Performance;

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
        this.performance = new Performance();

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
            if (this.errors.isTimeout() || this.container.config.core === false) {
                return;
            }

            const enabledModules = modulesWithCron.filter((module) => user.modules[module.name]);

            if (enabledModules.size > 0) {
                await this.refreshUser(user, enabledModules);
            } else {
                this.container.logger.debug(
                    this,
                    Logger.moduleContext(user),
                    'User has no enabled modules.',
                );
            }
        }
    }

    private async refreshUser(
        user: User,
        enabledModules: Collection<string, Module<ModuleOptions>>,
    ) {
        try {
            this.performance.set('modules');
            await Modules.executeModules(user, enabledModules);

            this.performance.addDataPoint();
        } catch (error) {
            if (error instanceof HTTPError) {
                new CoreRequestErrorHandler(error, this).init();
            } else {
                this.errors.addGeneric();
                new ErrorHandler(error).init();
            }
        }
    }
}
