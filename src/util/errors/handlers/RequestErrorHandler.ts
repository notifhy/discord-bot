import { cleanLength, cleanRound, sendWebHook } from '../../utility';
import {
    fatalWebhook,
    hypixelAPIWebhook,
    keyLimit,
    nonFatalWebhook,
    ownerID,
} from '../../../../config.json';
import { HypixelModuleManager } from '../../../hypixelAPI/HypixelModuleManager';
import AbortError from '../AbortError';
import BaseErrorHandler from './BaseErrorHandler';
import ConstraintError from '../ConstraintError';
import HTTPError from '../HTTPError';
import RateLimitError from '../RateLimitError';

export class RequestErrorHandler extends BaseErrorHandler {
    hypixelModuleManager: HypixelModuleManager;
    timeout: string | null;

    constructor(error: unknown, hypixelModuleManager: HypixelModuleManager) {
        super(error);
        this.hypixelModuleManager = hypixelModuleManager;

        const { errors } = this.hypixelModuleManager;

        if (this.error instanceof AbortError) {
            errors.addAbort();
        } else if (this.error instanceof RateLimitError) {
            errors.addRateLimit(this.error.json?.global);
        } else {
            errors.addError();
        }

        this.errorLog();

        const { resumeAfter } = this.hypixelModuleManager.instance;

        this.timeout = cleanLength(resumeAfter - Date.now(), true);
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
            instanceUses,
            keyPercentage,
        } = this.hypixelModuleManager.instance;

        const {
            errors: {
                abort,
                rateLimit,
                error,
            },
        } = this.hypixelModuleManager;

        const embed = this.errorEmbed()
            .setTitle('Degraded Performance')
            .addFields([
                {
                    name: 'Type',
                    value:
                        this.error instanceof Error
                            ? this.error.name ?? 'Unknown'
                            : 'Unknown',
                },
                {
                    name: 'Resuming In',
                    value:
                        this.timeout ??
                        'Not applicable',
                },
                {
                    name: 'Listed Cause',
                    value:
                        this.error instanceof Error
                            ? this.error.message
                            : 'Unknown',
                },
                {
                    name: 'Global Rate Limit',
                    value:
                        this.error instanceof RateLimitError &&
                        rateLimit.isGlobal === true
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
                    Instance Queries: ${instanceUses}`,
                },
            ]);

        return embed;
    }

    async systemNotify() {
        const embeds = [];
        const embed = this.statusEmbed();

        if (this.error instanceof AbortError) {
            if (this.timeout !== null) {
                embed
                    .setDescription('A timeout has been applied.');
            }

            embeds.push(embed);
        } else if (this.error instanceof RateLimitError) {
            embed
                .setDescription(
                    'A timeout has been applied. Dedicated queries have been lowered by 5%.',
                );

            embeds.push(embed);
        } else if (this.error instanceof HTTPError) {
            embed
                .setDescription('A timeout has been applied.').addField(
                    'Request',
                    `Status: ${this.error.status}
                    Status Text: ${this.error.statusText}`,
                );

            embeds.push(embed);
        } else {
            embeds.push(this.errorStackEmbed(this.error));
        }

        await sendWebHook({
            content:
                this.timeout === null
                    ? null
                    : `<@${ownerID.join('><@')}>`,
            embeds: embeds,
            webhook:
                this.error instanceof ConstraintError
                    ? nonFatalWebhook
                    : this.hypixelModuleManager
                    ? hypixelAPIWebhook
                    : fatalWebhook,
            suppressError: true,
        });
    }
}