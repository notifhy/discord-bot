import type { RawUserAPIData, UserAPIData } from '../@types/database';
import { Client } from 'discord.js';
import { formattedUnix } from '../util/utility';
import { RequestErrors } from './RequestErrors';
import { RequestInstance } from './RequestInstance';
import { RequestRequest } from './RequestRequest';
import { keyLimit } from '../../config.json';
import { ModuleManager } from '../module/ModuleManager';
import { setTimeout } from 'node:timers/promises';
import { SQLiteWrapper } from '../database';
import Constants from '../util/Constants';
import RequestErrorHandler from '../util/errors/handlers/RequestErrorHandler';

export type Performance = {
    start: number;
    uses: number;
    fetch: number;
    data: number;
    modules: number;
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

            const allUsers = (
                await SQLiteWrapper.getAllUsers<
                    RawUserAPIData,
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
                })
            ) as UserAPIData[];

            const users = allUsers.filter(user => user.modules.length > 0);

            const keyQueryLimit = keyLimit * this.instance.keyPercentage;
            const intervalBetweenRequests =
                (60 / keyQueryLimit) * Constants.ms.second;

            for (const user of users) {
                const urls = this.request.generateURLS(user);
                this.actuallyDoStuff(user, urls);
                await setTimeout(intervalBetweenRequests * urls.length); //eslint-disable-line no-await-in-loop
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
                fetch: 0,
                data: 0,
                modules: 0,
            };

            console.log(
                formattedUnix({ date: true, utc: false }),
                user.uuid,
            );

            const cleanHypixelData =
                await this.request.executeRequest(user, urls);

            performance.fetch = Date.now() - performance.start;

            await new ModuleManager(
                this.client,
                user.discordID,
                cleanHypixelData,
            ).process(performance);

            performance.modules = Date.now() - performance.start;

            this.logPerformance(performance);
        } catch (error) {
            await new RequestErrorHandler(error, this)
                .systemNotify();
        }
    }

    logPerformance(performance: Performance) {
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
