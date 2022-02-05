import type { UserAPIData } from '../../@types/database';
import { Client, DiscordAPIError } from 'discord.js';
import { HypixelErrors } from './HypixelErrors';
import { keyLimit } from '../../../config.json';
import { ModuleManager } from './ModuleManager';
import {
    Performance,
    RequestManager,
} from './RequestManager';
import { setTimeout } from 'node:timers/promises';
import { SQLite } from '../../util/SQLite';
import Constants from '../util/Constants';
import ErrorHandler from '../../util/errors/ErrorHandler';
import GlobalConstants from '../../util/Constants';
import ModuleDiscordErrorHandler from '../errors/ModuleDiscordErrorHandler';
import ModuleError from '../errors/ModuleError';
import ModuleErrorHandler from '../errors/ModuleErrorHandler';
import RequestErrorHandler from '../errors/RequestErrorHandler';

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
                await ErrorHandler.init(error);
                continue;
            }
        }
    }

    private async refresh() {
        if (this.errors.isTimeout()) {
            await setTimeout(this.errors.getTimeout());
        } else if (this.client.config.enabled === false) {
            await setTimeout(5_000); //Avoids blocking other processes
            return;
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
                this.errors.isTimeout() ||
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

            let data, payload;

            try {
                data = await this.request.request(user, urls);
                performance.fetch = Date.now();
            } catch (error) {
                await RequestErrorHandler.init(error, this);
                continue;
            }

            try {
                payload = await ModuleManager.process(user.discordID, data);
                performance.process = Date.now();
            } catch (error) {
                await ErrorHandler.init(error);
                continue;
            }

            try {
                await this.module.execute(payload);
                performance.modules = Date.now();
            } catch (error) {
                if (
                    (
                        error instanceof ModuleError &&
                        error.raw instanceof DiscordAPIError
                    ) ||
                    (
                        error instanceof DiscordAPIError
                    )
                ) {
                    await ModuleDiscordErrorHandler.init(
                        this.client,
                        user.discordID,
                        error as (
                            DiscordAPIError |
                            (Omit<ModuleError, 'raw'> & { raw: DiscordAPIError })
                        ),
                    );
                } else {
                    await ModuleErrorHandler.init(error, user.discordID, this);
                }

                continue;
            }

            this.updatePerformance(performance);

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

        if (history[0]?.start + GlobalConstants.ms.hour > Date.now()) return;

        history.unshift(performance);

        history.splice(Constants.limits.performanceHistory);
    }
}