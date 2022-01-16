import type { UserAPIData } from '../@types/database';
import { Client } from 'discord.js';
import { keyLimit } from '../../config.json';
import { ModuleManager } from './module/ModuleManager';
import {
    Performance,
    RequestManager,
} from './request/RequestManager';
import { setTimeout } from 'node:timers/promises';
import { SQLite } from '../util/SQLite';
import Constants from '../util/Constants';

/* eslint-disable no-await-in-loop */

export class DataManager {
    client: Client;
    module: ModuleManager;
    request: RequestManager;

    constructor(client: Client) {
        this.client = client;
        this.module = new ModuleManager(client);
        this.request = new RequestManager();
    }

    async ready() {
        while (true) await this.refresh();
    }

    private async refresh() {
        if (this.request.resumeAfter > Date.now()) {
            await setTimeout(this.request.resumeAfter);
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
            const urls = this.request.getURLs(user);

            const performance = {
                ...Constants.defaults.performance,
                start: Date.now(),
                uses: this.request.uses,
            };

            const data = await this.request.request(user, urls);
            performance.fetch = Date.now();

            const payload = await ModuleManager.process(user.discordID, data);
            performance.process = Date.now();

            await this.module.execute(payload);
            performance.modules = Date.now();

            this.updatePerformance(performance);

            const timeout = this.getTimeout(urls);
            await setTimeout(timeout);
        }
    }

    private getTimeout(urls: string[]) {
        const keyQueryLimit = keyLimit * this.request.keyPercentage;
        const intervalBetweenRequests = (60 / keyQueryLimit) * 1000;
        return intervalBetweenRequests * urls.length;
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