import type { users as User } from '@prisma/client';
import { DiscordAPIError } from '@discordjs/rest';
import { RESTJSONErrorCodes } from 'discord-api-types/v10';
import { BaseErrorHandler } from './BaseErrorHandler';
import { ErrorHandler } from './ErrorHandler';
import type { Module } from '../structures/Module';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Options } from '../utility/Options';

export class ModuleErrorHandler<E> extends BaseErrorHandler<E> {
    private readonly module: Module;

    private readonly user: User;

    public constructor(error: E, module: Module, user: User) {
        super(error);

        this.i18n.setLocale(user.locale);

        this.module = module;
        this.user = user;
    }

    public async init() {
        try {
            this.sentry.moduleContext(this.error, this.module, this.user);
            this.report();

            if (this.error instanceof DiscordAPIError) {
                await this.handleDiscordAPIError();
            } else {
                await this.handleGenericError();
            }
        } catch (error2) {
            new ErrorHandler(error2, this.incidentId).init();
        }
    }

    private async disableModule() {
        return this.container.database.modules.update({
            data: {
                [this.module.name]: {
                    set: false,
                },
            },
            where: {
                id: this.user.id,
            },
        });
    }

    private async handleDiscordAPIError() {
        const error = this.error as DiscordAPIError;
        switch (error.code) {
            case RESTJSONErrorCodes.UnknownChannel:
            case RESTJSONErrorCodes.MissingAccess:
            // @ts-ignore eslint-disable-next-line no-fallthrough
            case RESTJSONErrorCodes.MissingPermissions:
                try {
                    const user = await this.container.client.users.fetch(this.user.id);

                    const alertEmbed = new BetterEmbed()
                        .setColor(Options.colorsWarning)
                        .setTitle(this.i18n.getMessage('errorsModuleDiscordAPIErrorTitle'))
                        .setDescription(
                            this.i18n.getMessage(`errorsModuleDiscordAPIError${error.code}`),
                        )
                        .setFooter({ text: this.i18n.getMessage(this.module.localizationFooter) });

                    await user.send({ embeds: [alertEmbed] });
                } catch (error2) {
                    this.log('Failed to send DM alert', error2);
                }
            // fall through - only send message if remotely possible
            case RESTJSONErrorCodes.UnknownUser:
            case RESTJSONErrorCodes.CannotSendMessagesToThisUser:
                try {
                    this.log('Attempting to disable module.');

                    const modules = await this.disableModule();

                    await this.container.database.system_messages.create({
                        data: {
                            id: this.user.id,
                            timestamp: Date.now(),
                            name_key: 'errorsModuleDisabledTitle',
                            name_variables: [this.i18n.getMessage(this.module.localizationName)],
                            value_key: `errorsModuleDiscordAPIError${error.code}`,
                        },
                    });

                    this.log('Handled Discord API error:', error.code, 'New modules:', modules);
                } catch (error2) {
                    new ErrorHandler(
                        error2,
                        this.incidentId,
                        'Failed to disable module and send system message',
                    ).init();
                }

                break;
            default:
                this.log('Could not handle Discord API error:', error.code);
        }
    }

    private async handleGenericError() {
        try {
            const user = await this.container.client.users.fetch(this.user.id);

            const title = 'errorsModuleGenericTitle';
            const description = 'errorsModuleGenericDescription';

            const alertEmbed = new BetterEmbed()
                .setColor(Options.colorsError)
                .setTitle(this.i18n.getMessage(title))
                .setDescription(this.i18n.getMessage(description))
                .setFooter({ text: this.i18n.getMessage(this.module.localizationFooter) });

            const settledPromises = await Promise.allSettled([
                user.send({ embeds: [alertEmbed] }),
                this.container.database.system_messages.create({
                    data: {
                        id: this.user.id,
                        timestamp: Date.now(),
                        name_key: title,
                        value_key: description,
                    },
                }),
            ]);

            // eslint-disable-next-line no-restricted-syntax
            for (const promise of settledPromises) {
                if (promise.status === 'rejected') {
                    this.log('Failed to handle part of the error:', promise.reason);
                }
            }
        } catch (error) {
            new ErrorHandler(error, this.incidentId, 'Failed to handle generic error.').init();
        }
    }
}
