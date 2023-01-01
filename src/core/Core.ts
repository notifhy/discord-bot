import type { modules as ModulesType, users as User } from '@prisma/client';
import { Collection, DiscordAPIError } from 'discord.js';
import cron, { ScheduledTask } from 'node-cron';
import { Counter, Gauge } from 'prom-client';
import { ErrorHandler } from '../errors/ErrorHandler';
import { Base } from '../structures/Base';
import type { Module, ModuleOptions } from '../structures/Module';
import { Logger } from '../structures/Logger';
import { ModuleErrorHandler } from '../errors/ModuleErrorHandler';
import { Timeout } from '../structures/Timeout';
import { Time } from '../enums/Time';

/* eslint-disable no-await-in-loop */

export class Core extends Base {
    private cron: ScheduledTask;

    private readonly timeout: Timeout;

    private static cronErrorsCounter = new Counter({
        name: 'notifhy_cron_errors_total',
        help: 'Total number of errors',
    });

    private static cronDurationGauge = new Gauge({
        name: 'notifhy_cron_duration_seconds',
        help: 'Duration of each cron by user',
        labelNames: ['uuid'] as const,
    });

    public constructor() {
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

        this.timeout = new Timeout({ baseTimeout: Time.Second * 30, resetAfter: Time.Hour });
        this.container.logger.debug(this, `Cron scheduled with ${this.container.config.coreCron}.`);
    }

    public async init() {
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

    public cronUpdate() {
        this.cronStop();

        this.cron = cron.schedule(
            this.container.config.coreCron,
            async () => {
                await this.preconditions();
            },
            {
                scheduled: this.container.config.core,
            },
        );
    }

    private async preconditions() {
        try {
            if (this.timeout.hasTimeout() || this.container.config.core === false) {
                return;
            }

            await this.refresh();
        } catch (error) {
            this.timeout.add();
            new ErrorHandler(error).init();
            Core.cronErrorsCounter.inc();
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
            if (this.timeout.hasTimeout() || this.container.config.core === false) {
                return;
            }

            const end = Core.cronDurationGauge.startTimer({ uuid: user.uuid });

            await this.refreshUser(user, user.modules, modulesWithCron);

            end();
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
                'User has no enabled modules for <Module>.cron.',
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
                        this.timeout.add();
                        Core.cronErrorsCounter.inc();
                        break;
                    }
                }
            }
        }
    }
}
