import type { UserAPIData } from '../../@types/database';
import {
    BetterEmbed,
    cleanLength,
    cleanRound,
    formattedUnix,
    sendWebHook,
    slashCommandResolver,
} from '../utility';
import { CommandInteraction, Interaction, TextChannel } from 'discord.js';
import { ErrorStackEmbed, replyToError } from './helper';
import {
    fatalWebhook,
    hypixelAPIWebhook,
    keyLimit,
    nonFatalWebhook,
    ownerID,
} from '../../../config.json';
import { HypixelModuleManager } from '../../hypixelAPI/HypixelModuleManager';
import AbortError from './AbortError';
import Constants from '../Constants';
import ConstraintError from './ConstraintError';
import HTTPError from './HTTPError';
import ModuleError from './ModuleError';
import RateLimitError from './RateLimitError';

/**
    * API Errors should be handled in HypixelModuleRequest or similar
        * Only Abort Errors/HTTPS Errors should be sent to the api error webhook

    * Handle command errors in interactionCreate
        * Unify constraint errors and rename

    * Unified logging system, which would be this file
        * Store static formattings here though.

    * Module error class with a collection on offenders

    * Fix the rateLimit Global issue
*/

export default class ErrorHandler { //this thing sucks
    error: Error | unknown;
    interaction?: Interaction;
    hypixelModuleManager?: HypixelModuleManager;
    moduleUser?: UserAPIData;
    incidentID: string;

    constructor({
        error,
        interaction,
        hypixelModuleManager,
        moduleUser,
    }: {
        error: Error | unknown;
        interaction?: Interaction;
        hypixelModuleManager?: HypixelModuleManager;
        moduleUser?: UserAPIData;
    }) {
        this.error = error;
        this.interaction = interaction;
        this.hypixelModuleManager = hypixelModuleManager;
        this.moduleUser = moduleUser;
        this.incidentID = Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase();

        this.log();
    }

    private baseGuildEmbed() {
        const { client, channel, createdTimestamp, guild, id, user } = this
            .interaction as CommandInteraction;
        const command = slashCommandResolver(
            this.interaction as CommandInteraction,
        );

        return this.errorEmbed().addFields([
            { name: 'User', value: `Tag: ${user.tag}\nID: ${user.id}` },
            {
                name: 'Interaction',
                value: `${id}\nCommand: ${command}\nCreated At: <t:${Math.round(
                    createdTimestamp / Constants.ms.second,
                )}:R>`,
            },
            {
                name: 'Guild',
                value: `Guild ID: ${guild?.id}\nGuild Name: ${
                    guild?.name
                }\nOwner ID: ${guild?.ownerId ?? 'None'}\nGuild Member Count: ${
                    guild?.memberCount
                }`,
            },
            {
                name: 'Channel',
                value: `Channel ID: ${channel?.id}\nChannel Type: ${
                    channel?.type
                }\nName: ${
                    channel instanceof TextChannel ? channel.name : 'N/A'
                }\nDeleted: ${
                    channel instanceof TextChannel ? channel.deleted : 'N/A'
                }`,
            },
            { name: 'Other', value: `Websocket Ping: ${client.ws.ping}` },
        ]);
    }

    private errorEmbed() {
        return new BetterEmbed({
            name: this.incidentID,
        }).setColor(Constants.colors.error);
    }

    private getPriority() {
        //A lower number means a higher priority
        if (this.error instanceof AbortError) {
            if (
                (this.hypixelModuleManager?.instance?.resumeAfter ?? 0) <
                Date.now()
            ) {
                console.log(
                    4,
                    this.hypixelModuleManager?.instance?.resumeAfter,
                );
                return 4;
            }
            console.log(2, this.hypixelModuleManager?.instance?.resumeAfter);
            return 2;
        }

        if (this.error instanceof ConstraintError) {
            console.log(3);
            return 3;
        }
        if (this.error instanceof ModuleError) {
            console.log(2, '2');
            return 2;
        }
        console.log(1);
        return 1;
    }

    private log() {
        const time = formattedUnix({ date: true, utc: true });
        const base = `${time} | Incident ${
            this.incidentID
        } | Priority: ${this.getPriority()} | `;
        if (this.interaction?.isCommand()) {
            if (this.error instanceof ConstraintError) {
                console.error(
                    base,
                    `${this.interaction.user.tag} failed the constraint ${this.error.message}`,
                );
            } else {
                console.error(base, this.error);
            }
        } else if (this.error instanceof AbortError) {
            console.error(base, this.error.message);
        } else {
            console.error(base, this.error);
        }
    }

    async userNotify() {
        const embeds = [];

        if (this.interaction?.isCommand()) {
            const embed = this.errorEmbed();
            const { commandName, id } = this.interaction;

            if (this.error instanceof ConstraintError) {
                return;
            }

            embed
                .setTitle('Oops')
                .setDescription(
                    `An error occurred while executing the command /${commandName}! This error has been automatically forwarded for review. It should be resolved soon. Sorry.`,
                )
                .addField('Interaction ID', id);
            embeds.push(embed);

            if (embeds.length > 0) {
                await replyToError({
                    embeds: embeds,
                    interaction: this.interaction,
                    incidentID: this.incidentID,
                });
            }
        }
    }

    async systemNotify() {
        //I hate it, but it works. Refactor needed asap
        const embeds = [];

        if (this.interaction?.isCommand()) {
            const embed = this.baseGuildEmbed();
            if (this.error instanceof ConstraintError) {
                embed
                    .setTitle('User Failed Constraint')
                    .setDescription(`Constraint: ${this.error.message}`);

                embeds.push(embed);
            } else {
                embed.setTitle('Unexpected Error');
                embeds.push(
                    embed,
                    new ErrorStackEmbed(this.error, this.incidentID),
                );
            }
        } else if (this.hypixelModuleManager) {
            const { errors } = this.hypixelModuleManager;

            if (this.error instanceof AbortError) {
                errors.addAbort();
            } else if (this.error instanceof RateLimitError) {
                errors.addRateLimit(this.error.json?.global);
            } else {
                errors.addError();
            }

            const { instanceUses, resumeAfter, keyPercentage } =
                this.hypixelModuleManager.instance;

            const timeout = cleanLength(resumeAfter - Date.now(), true);
            console.log('1', this.hypixelModuleManager?.instance?.resumeAfter);
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
                    { name: 'Resuming In', value: timeout ?? 'Not applicable' },
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
                            this.hypixelModuleManager.errors.rateLimit
                                .isGlobal === true
                                ? 'Yes'
                                : 'No',
                    },
                    {
                        name: 'Last Minute Statistics',
                        value: `Abort Errors: ${this.hypixelModuleManager.errors.abort.lastMinute} 
                        Rate Limit Hits: ${this.hypixelModuleManager.errors.rateLimit.lastMinute}
                        Other Errors: ${this.hypixelModuleManager.errors.error.lastMinute}`,
                    },
                    {
                        name: 'Next Timeouts',
                        value: `May not be accurate
                        Abort Errors: ${cleanLength(
                            this.hypixelModuleManager.errors.abort.timeout,
                        )}
                        Rate Limit Errors: ${cleanLength(
                            this.hypixelModuleManager.errors.rateLimit.timeout,
                        )}
                        Other Errors: ${cleanLength(
                            this.hypixelModuleManager.errors.error.timeout,
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

            if (this.error instanceof AbortError) {
                if (timeout !== null) {
                    embed.setDescription('A timeout has been applied.');
                }
            } else if (this.error instanceof RateLimitError) {
                embed.setDescription(
                    'A timeout has been applied. Dedicated queries have been lowered by 5%.',
                );
            } else if (this.error instanceof HTTPError) {
                embed.setDescription('A timeout has been applied.').addField(
                    'Request',
                    `Status: ${this.error.status}
                    Status Text: ${this.error.statusText}`,
                );
            } else {
                embeds.push(new ErrorStackEmbed(this.error, this.incidentID));
            }

            embeds.unshift(embed);
        } else if (this.error instanceof ModuleError) {
            const embed = this.errorEmbed()
                .setTitle('Module Error')
                .addFields([
                    { name: 'Module', value: this.error.module },
                    { name: 'User', value: this.error.user.discordID },
                ]);

            embeds.push(embed);
        } else {
            embeds.push(new ErrorStackEmbed(this.error, this.incidentID));
        }

        await sendWebHook({
            content:
                this.getPriority() <= 2
                    ? `<@${ownerID.join('><@')}>`
                    : undefined,
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
