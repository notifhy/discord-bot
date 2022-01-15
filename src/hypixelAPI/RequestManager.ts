import type { UserAPIData } from '../@types/database';
import { Client } from 'discord.js';
import { RequestErrors } from './RequestErrors';
import { RequestInstance } from './RequestInstance';
import { RequestRequest } from './RequestRequest';
import { keyLimit } from '../../config.json';
import { ModuleManager } from '../module/ModuleManager';
import { setTimeout } from 'node:timers/promises';
import { SQLite } from '../util/SQLite';
import Constants from '../util/Constants';
import RequestErrorHandler from '../util/errors/handlers/RequestErrorHandler';
import { Log } from '../util/Log';

export type Performance = {
    start: number;
    uses: number;
    total: number; //Sum of the rest below
    fetch: number; //Hypixel API fetch
    databaseFetch: number; //Database fetch
    process: number; //Processing data
    save: number; //Saving to database
    modules: number; //Executing module(s)
}

export class RequestManager {
    readonly instance: RequestInstance;
    readonly errors: RequestErrors;
    readonly client: Client;
    readonly request: RequestRequest;

    constructor(client: Client) {
        this.client = client;
        this.instance = new RequestInstance();
        this.errors = new RequestErrors(this.instance);
        this.request = new RequestRequest(this.instance);
    }

    async forever() {
        while (true) {
            await this.refreshData(); //eslint-disable-line no-await-in-loop
        }
    }

    async refreshData() {
        try {
            if (this.instance.resumeAfter > Date.now()) {
                await setTimeout(this.instance.resumeAfter - Date.now());
            }

            const allUsers =
                await SQLite.getAllUsers<
                    UserAPIData
                >({
                    table: Constants.tables.api,
                    columns: [
                        'discordID',
                        'uuid',
                        'modules',
                        'lastLogin',
                        'lastLogout',
                    ],
                });

            const users = allUsers.filter(user => user.modules.length > 0);

            const keyQueryLimit = keyLimit * this.instance.keyPercentage;
            const intervalBetweenRequests =
                (60 / keyQueryLimit) * Constants.ms.second;

            for (const user of users) {
                const urls = this.request.generateURLS(user);
                await this.actuallyDoStuff(user, urls); //eslint-disable-line no-await-in-loop
                await setTimeout( //eslint-disable-line no-await-in-loop
                    Math.max(
                        (intervalBetweenRequests * urls.length) -
                        (this.instance.performance.latest?.total ?? 0),
                        0,
                    ),
                );
            }
        } catch (error) {
            await new RequestErrorHandler(error, this)
                .systemNotify();
        }
    }

    async actuallyDoStuff(user: UserAPIData, urls: string[]) {
        try {
            if (
                this.instance.resumeAfter > Date.now() ||
                this.client.config.enabled === false
            ) {
                return;
            }

            const uses =
                this.client.hypixelAPI.instance.instanceUses;

            const performance: Performance = {
                start: Date.now(),
                uses: uses,
                total: 0,
                fetch: 0,
                databaseFetch: 0,
                process: 0,
                save: 0,
                modules: 0,
            };

            Log.log(user.uuid);

            const cleanHypixelData =
                await this.request.executeRequest(user, urls);

            performance.fetch = Date.now();

            await new ModuleManager(
                this.client,
                user.discordID,
                cleanHypixelData,
            ).process(performance);

            performance.modules = Date.now();

            this.logPerformance(performance);
        } catch (error) {
            await new RequestErrorHandler(error, this)
                .systemNotify();
        }
    }

    logPerformance(performance: Performance) {
        performance.total = performance.modules - performance.start; //Turns the ms since the Jan 1st 1970 into relative
        performance.modules -= performance.save;
        performance.save -= performance.process;
        performance.process -= performance.databaseFetch;
        performance.databaseFetch -= performance.fetch;
        performance.fetch -= performance.start;

        this.instance.performance.latest = performance;

        const history =
            this.instance.performance.history;

        if (
            history[0]?.start +
                Constants.ms.hour > Date.now()
        ) {
            return;
        }

        history.unshift(
            performance,
        );

        history.splice(
            Constants.limits.performanceHistory,
        );
    }
}
