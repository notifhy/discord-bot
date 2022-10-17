import { setTimeout } from 'node:timers/promises';
import { type users as User } from '@prisma/client';
import { Data } from './Data';
import { Time } from '../enums/Time';
import { Errors } from './Errors';
import { ErrorHandler } from '../errors/ErrorHandler';
import { HTTPError } from '../errors/HTTPError';
import { RequestErrorHandler } from '../errors/RequestErrorHandler';
import { Modules } from './Modules';
import { Requests } from './Requests';
import { Base } from '../structures/Base';
import { Performance } from '../structures/Performance';
import { Options } from '../utility/Options';

/* eslint-disable no-await-in-loop */

export class Core extends Base {
    public readonly data: Data;

    public readonly errors: Errors;

    public readonly modules: Modules;

    public readonly performance: Performance;

    public readonly requests: Requests;

    constructor() {
        super();

        this.data = new Data();
        this.errors = new Errors();
        this.modules = new Modules();
        this.performance = new Performance();
        this.requests = new Requests();
    }

    public async init() {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                if (this.errors.isTimeout()) {
                    await setTimeout(this.errors.getTimeout());
                } else if (this.container.config.core === false) {
                    await setTimeout(Options.coreDisabledTimeout);
                } else {
                    await this.refresh();
                }
            } catch (error) {
                new ErrorHandler(error).init();
            }
        }
    }

    private async refresh() {
        const users = await this.container.database.users.findMany();

        if (users.length === 0) {
            await setTimeout(Time.Second * 10);
            return;
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const user of users) {
            if (
                this.errors.isTimeout()
                || this.container.config.core === false
            ) {
                return;
            }

            await this.refreshUser(user);
        }
    }

    private async refreshUser(user: User) {
        try {
            this.performance.set('urls');
            const urls = await this.requests.getURLs(user);

            this.performance.set('fetch');
            const cleanHypixelData = await this.requests.request(urls);

            this.performance.set('data');
            const changes = await this.data.parse(user, cleanHypixelData);

            this.performance.set('modules');
            await this.modules.execute(user, cleanHypixelData, changes);

            this.performance.addDataPoint();

            await setTimeout(
                (Time.Minute / this.container.config.requestBucket) * urls.length,
            );
        } catch (error) {
            if (error instanceof HTTPError) {
                new RequestErrorHandler(error, this).init();
            } else {
                this.errors.addGeneric();
                new ErrorHandler(error).init();
            }
        }
    }
}