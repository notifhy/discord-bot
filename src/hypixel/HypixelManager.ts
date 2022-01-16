import type { UserAPIData } from '../@types/database';
import { Client } from 'discord.js';
import { keyLimit } from '../../config.json';
import { ModuleManager } from './ModuleManager';
import {
    Performance,
    RequestManager,
} from './RequestManager';
import { setTimeout } from 'node:timers/promises';
import { SQLite } from '../util/SQLite';
import Constants from '../util/Constants';
import ErrorHandler from '../util/errors/handlers/ErrorHandler';
import RequestErrorHandler from '../util/errors/handlers/RequestErrorHandler';
import { HypixelErrors } from './HypixelErrors';

/* eslint-disable no-await-in-loop */

export class HypixelManager {
    client: Client;
    module: ModuleManager;
    request: RequestManager;
    errors: HypixelErrors;

    constructor(client: Client) {
        this.client = client;
        this.module = new ModuleManager(client);
        this.request = new RequestManager();
        this.errors = new HypixelErrors(this.request);
    }

    async ready() {
        while (true) {
            try {
                await this.refresh();
            } catch (error) {
                await new RequestErrorHandler(error, this)
                    .systemNotify();
            }
        }
    }

    private async refresh() {
        if (this.request.resumeAfter > Date.now()) {
            await setTimeout(this.request.resumeAfter - Date.now());
        } else if (this.client.config.enabled === false) {
            await setTimeout(5_000); //Avoids blocking other processes
        }

        const users = (
            await SQLite.getAllUsers<UserAPIData>({
                table: Constants.tables.api,
                columns: [
                    'discordID',
                    'uuid',
                    'modules',
                    'lastLogin',
                    'lastLogout',
                ],
            })
        ).filter(user => user.modules.length > 0);

        for (const user of users) {
            if (
                this.request.resumeAfter > Date.now() ||
                this.client.config.enabled === false
            ) {
                return;
            }

            const urls = this.request.getURLs(user);

            const performance = {
                ...Constants.defaults.performance,
                start: Date.now(),
                uses: this.request.uses,
            };

            const data = await this.request.request(user, urls);
            performance.fetch = Date.now();

            try {
                const payload =
                    await ModuleManager.process(user.discordID, data);
                performance.process = Date.now();

                await this.module.execute(payload);
                performance.modules = Date.now();

                this.updatePerformance(performance);
            } catch (error) {
                this.errors.addError();
                await new ErrorHandler(error, `ID: ${user.discordID}`)
                    .systemNotify();
            }

            const timeout = this.getTimeout(urls, performance);
            await setTimeout(timeout);
        }
    }

    private getTimeout(urls: string[], performance: Performance) {
        const keyQueryLimit = keyLimit * this.request.keyPercentage;
        const intervalBetweenRequests = (60 / keyQueryLimit) * 1000;
        const total = intervalBetweenRequests * urls.length;
        return Math.max(total - performance.total, 0);
    }

    private updatePerformance(performance: Performance) {
        performance.total = performance.modules - performance.start; //Turns the ms since the Jan 1st 1970 into relative
        performance.modules -= performance.process;
        performance.process -= performance.fetch;
        performance.fetch -= performance.start;

        this.request.performance.latest = performance;

        const { history } = this.request.performance;

        if (history[0]?.start + Constants.ms.hour > Date.now()) return;

        history.unshift(performance);

        history.splice(Constants.limits.performanceHistory);
    }
}