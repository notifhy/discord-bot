import {
    cleanLength,
    cleanRound,
    sendWebHook,
} from '../../util/utility';
import {
    fatalWebhook,
    hypixelAPIWebhook,
    keyLimit,
    ownerID,
} from '../../../config.json';
import { FetchError } from 'node-fetch';
import { HypixelManager } from '../hypixel/HypixelManager';
import AbortError from './AbortError';
import BaseErrorHandler from '../../util/errors/BaseErrorHandler';
import ErrorHandler from '../../util/errors/ErrorHandler';
import HTTPError from './HTTPError';
import RateLimitError from './RateLimitError';

export default class RequestErrorHandler<E> extends BaseErrorHandler<E> {
    readonly hypixelManager: HypixelManager;
    readonly timeout: string | null;

    constructor(error: E, hypixelManager: HypixelManager) {
        super(error);
        this.hypixelManager = hypixelManager;

        const { errors } = this.hypixelManager;

        if (this.error instanceof AbortError) {
            errors.addAbort();
        } else if (this.error instanceof RateLimitError) {
            errors.addRateLimit({
                rateLimitGlobal: this.error.json?.global ?? null,
                ratelimitReset: this.error.response?.headers?.get('ratelimit-reset') ?? null,
            });
        } else {
            errors.addError();
        }

        const { resumeAfter } = this.hypixelManager.errors;

        this.timeout = cleanLength(resumeAfter - Date.now(), true);
    }

    static async init<T>(error: T, hypixelManager: HypixelManager) {
        const handler = new RequestErrorHandler(error, hypixelManager);

        try {
            handler.errorLog();
            await handler.systemNotify();
        } catch (error2) {
            await ErrorHandler.init(error2, handler.incidentID);
        }
    }

    private errorLog() {
        if (this.error instanceof AbortError) {
            this.log(this.error.name);
        } else {
            this.log(this.error);
        }
    }

    private statusEmbed() {
        const {
            errors: {
                isGlobal,
                abort,
                rateLimit,
                error,
            },
            request: {
                keyPercentage,
                uses,
            },
        } = this.hypixelManager;

        const embed = this.baseErrorEmbed()
            .setTitle('Degraded Performance')
            .addFields(
                {
                    name: 'Type',
                    value:
                        this.error instanceof Error
                            ? this.error.name
                            : 'Unknown',
                },
                {
                    name: 'Resuming In',
                    value:
                        this.timeout ??
                        'Not applicable',
                },
                {
                    name: 'Global Rate Limit',
                    value:
                        this.error instanceof RateLimitError &&
                        isGlobal === true
                                ? 'Yes'
                                : 'No',
                },
                {
                    name: 'Last Minute Statistics',
                    value: `Abort Errors: ${abort.lastMinute} 
                    Rate Limit Hits: ${rateLimit.lastMinute}
                    Other Errors: ${error.lastMinute}`,
                },
                {
                    name: 'Next Timeouts',
                    value: `May not be accurate
                     Abort Errors: ${cleanLength(
                        abort.timeout,
                    )}
                    Rate Limit Errors: ${cleanLength(
                        rateLimit.timeout,
                    )}
                    Other Errors: ${cleanLength(
                        error.timeout,
                    )}`,
                },
                {
                    name: 'API Key',
                    value: `Dedicated Queries: ${cleanRound(
                        keyPercentage * keyLimit,
                    )} or ${cleanRound(keyPercentage * 100)}%
                    Instance Queries: ${uses}`,
                },
            );

        return embed;
    }

    private async systemNotify() {
        const embed = this.statusEmbed();

        if (this.error instanceof AbortError) {
            if (this.timeout !== null) {
                embed
                    .setDescription('A timeout has been applied.');
            }
        } else if (this.error instanceof RateLimitError) {
            const headers = this.error.response?.headers;

            embed
                .setDescription(
                    'A timeout has been applied. Dedicated queries have been lowered by 5%.',
                )
                .addFields({
                    name: 'Header Data',
                    value: `Remaining: ${headers?.get('ratelimit-remaining') ?? 'Unknown'}
                    Reset: ${headers?.get('ratelimit-reset') ?? 'Unknown'}`,
                });
        } else if (this.error instanceof HTTPError) {
            embed
                .setDescription('A timeout has been applied.')
                .addFields({
                    name: 'Request',
                    value: `Status: ${this.error.status}`,
                });
        } else if (this.error instanceof FetchError) {
            embed
                .setDescription('A timeout has been applied.');
        } else {
            embed
                .setTitle('Unexpected Error');
        }

        await sendWebHook({
            content:
                this.timeout !== null ||
                !(this.error instanceof AbortError)
                    ? `<@${ownerID.join('><@')}>`
                    : null,
            embeds: [embed],
            files:
                this.error instanceof AbortError ||
                this.error instanceof RateLimitError ||
                this.error instanceof HTTPError ||
                this.error instanceof FetchError
                    ? undefined
                    : [this.stackAttachment],
            webhook:
                this.error instanceof HTTPError ||
                this.error instanceof FetchError
                    ? hypixelAPIWebhook
                    : fatalWebhook,
            suppressError: true,
        });
    }
}