import { setTimeout } from 'node:timers/promises';
import { ErrorHandler } from '../errors/ErrorHandler';
import { Base } from '../structures/Base';
import { Options } from '../utility/Options';
import { Errors } from './Errors';
import { Requests } from './Requests';

/* eslint-disable no-await-in-loop */

export class Core extends Base {
    public readonly errors: Errors;

    public readonly performance: Performance;

    public readonly requests: Requests;

    constructor() {
        super();
        this.errors = new Errors();
        this.performance = new Performance();
        this.requests = new Requests();
    }

    public async init() {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                await this.managePreconditions();
            } catch (error) {
                new ErrorHandler(error).init();
            }
        }
    }

    private async managePreconditions() {
        if (this.errors.isTimeout()) {
            await setTimeout(this.errors.getTimeout());
            return;
        }

        if (this.container.config.core === false) {
            await setTimeout(Options.coreDisabledTimeout);
            return;
        }

        await this.refresh();
    }

    private async refresh() {
        const users = await this.container.database.users.findMany();

    }
}