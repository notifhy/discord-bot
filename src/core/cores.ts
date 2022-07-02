import {
    Client,
    DiscordAPIError,
    HTTPError,
} from 'discord.js';
import { setTimeout } from 'node:timers/promises';
import type { UserAPIData } from '../@types/database';
import { Constants } from '../utility/Constants';
import { Data } from './datas';
import { Error } from './errors';
import { Module } from './modules';
import { Request } from './requests';
import { ErrorHandler } from '../errors/ErrorHandler';
import { keyLimit } from '../../config.json';
import { ModuleHTTPErrorHandler } from '../errors/ModuleHTTPErrorHandler';
import { ModuleError } from '../errors/ModuleError';
import { ModuleErrorHandler } from '../errors/ModuleErrorHandler';
import { RequestErrorHandler } from '../errors/RequestErrorHandler';
import { SQLite } from '../utility/SQLite';
import { Log } from '../utility/Log';

/* eslint-disable no-await-in-loop */

export type Performance = {
    start: number;
    uses: number;
    total: number; // Sum of the rest below
    fetch: number; // Hypixel API fetch
    process: number; // Processing & saving data
    modules: number; // Executing module(s)
};

export class Core {
    public readonly client: Client;

    public readonly error: Error;

    public readonly module: Module;

    public readonly performance: {
        latest: Performance | null;
        history: Performance[];
    };

    public readonly request: Request;

    public constructor(client: Client) {
        this.client = client;
        this.error = new Error();
        this.module = new Module(this.client);
        this.performance = {
            latest: null,
            history: [],
        };
        this.request = new Request(this.client);
    }

    public async start() {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                const reachedMaxTimeout = await Promise.race([
                    this.checkSystem(),
                    Core.maxTimeout(900000),
                ]);

                if (reachedMaxTimeout === true) {
                    Log.error('Hit a max timeout of 900000');
                }
            } catch (error) {
                this.error.addGeneric();
                await ErrorHandler.init(error);
            }
        }
    }

    public static async maxTimeout(timeout: number) {
        await setTimeout(timeout);
        return true;
    }

    private async checkSystem() {
        if (this.error.isTimeout()) {
            await setTimeout(this.error.getTimeout());
            return;
        }

        if (this.client.config.core === false) {
            await setTimeout(2500);
            return;
        }

        const users = SQLite.getAllUsers<UserAPIData>({
            table: Constants.tables.api,
            columns: [
                'discordID',
                'uuid',
                'modules',
                'lastLogin',
                'lastLogout',
            ],
        }).filter((user) => user.modules.length > 0);

        if (users.length === 0) {
            await setTimeout(2500);
            return;
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const user of users) {
            if (
                this.error.isTimeout()
                // @ts-expect-error possibility to not be true
                || this.client.config.core === false
            ) {
                return;
            }

            const reachedMaxTimeout = await Promise.race([
                this.refresh(user),
                Core.maxTimeout(15000),
            ]);

            if (reachedMaxTimeout === true) {
                Log.error('Hit a max timeout of 15000');
            }
        }
    }

    private async refresh(user: UserAPIData) {
        const urls = this.request.getURLs(user);

        const performance = {
            ...Constants.defaults.performance,
            start: Date.now(),
            uses: this.request.uses,
        };

        let data; let
            payload;

        try {
            data = await this.request.request(user, urls);
            performance.fetch = Date.now();
        } catch (error) {
            await RequestErrorHandler.init(error, this);
            await setTimeout(this.getTimeout(urls));
            return;
        }

        try {
            payload = Data.process(user.discordID, data);
            performance.process = Date.now();
        } catch (error) {
            await ErrorHandler.init(error);
            await setTimeout(this.getTimeout(urls));
            return;
        }

        try {
            await this.module.execute(payload);
            performance.modules = Date.now();
        } catch (error) {
            // beautiful
            if (
                (
                    error instanceof ModuleError
                    && (
                        error.raw instanceof DiscordAPIError
                        || error.raw instanceof HTTPError
                    )
                )
                || error instanceof DiscordAPIError
                || error instanceof HTTPError
            ) {
                await ModuleHTTPErrorHandler.init(
                    this.client,
                    user.discordID,
                    error as (
                        HTTPError |
                        (Omit<ModuleError, 'raw'> & { raw: HTTPError })
                    ),
                );
            } else {
                await ModuleErrorHandler.init(error, user.discordID, this);
            }

            await setTimeout(this.getTimeout(urls));
            return;
        }

        this.updatePerformance(performance);

        const timeout = this.getTimeout(urls, performance);
        await setTimeout(timeout);
    }

    private getTimeout(urls: string[], performance?: Performance) {
        const keyQueryLimit = keyLimit * this.client.config.keyPercentage;
        const intervalBetweenRequests = (60 / keyQueryLimit) * 1000;
        const total = intervalBetweenRequests * urls.length;

        return Math.max(total - (performance?.total ?? 0), 0);
    }

    private updatePerformance(performance: Performance) {
        // Turns the ms since the Jan 1st 1970 into relative
        performance.total = performance.modules - performance.start;
        performance.modules -= performance.process;
        performance.process -= performance.fetch;
        performance.fetch -= performance.start;

        this.performance.latest = performance;

        const { history } = this.performance;

        if (
            typeof history[0] === 'undefined'
            || history[0].start + Constants.ms.second > Date.now()
        ) return;

        history.unshift(performance);

        history.splice(Constants.limits.performanceHistory);
    }
}