import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import {
    ApplicationCommandOptionType,
    type ChatInputCommandInteraction,
    DiscordAPIError,
} from 'discord.js';
import type { SlothpixelPlayer } from '../@types/Hypixel';
import { HTTPError } from '../errors/HTTPError';
import { RequestErrorHandler } from '../errors/RequestErrorHandler';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Logger } from '../structures/Logger';
import { Request } from '../structures/Request';
import { Options } from '../utility/Options';
import { setPresence } from '../utility/utility';

export class RegisterCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'register',
            description: 'Register your Minecraft account and begin using modules',
            cooldownLimit: 5,
            cooldownDelay: 30_000,
            cooldownScope: BucketScope.User,
            preconditions: ['Base', 'DevMode'],
            requiredUserPermissions: [],
            requiredClientPermissions: [],
        });

        this.chatInputStructure = {
            name: this.name,
            description: this.description,
            options: [
                {
                    name: 'player',
                    type: ApplicationCommandOptionType.String,
                    description: 'Your username or UUID',
                    required: true,
                },
            ],
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        const exists = await this.container.database.users.findUnique({
            where: {
                id: interaction.user.id,
            },
        });

        if (exists) {
            const alreadyRegisteredEmbed = new BetterEmbed(interaction)
                .setColor(Options.colorsWarning)
                .setTitle(i18n.getMessage('commandsRegisterAlreadyRegisteredTitle'))
                .setDescription(i18n.getMessage('commandsRegisterAlreadyRegisteredDescription'));

            this.container.logger.warn(
                this,
                Logger.interactionLogContext(interaction),
                'Already registered.',
            );

            await interaction.editReply({ embeds: [alreadyRegisteredEmbed] });
            return;
        }

        const player = interaction.options.getString('player', true);

        if (
            Options.regexUUID.test(player) === false
            && Options.regexUsername.test(player) === false
        ) {
            const invalidEmbed = new BetterEmbed(interaction)
                .setColor(Options.colorsWarning)
                .setTitle(i18n.getMessage('commandsRegisterInvalidInputTitle'))
                .setDescription(
                    i18n.getMessage('commandsRegisterInvalidInputDescription', [player]),
                );

            this.container.logger.warn(
                this,
                Logger.interactionLogContext(interaction),
                'Invalid input:',
                player,
            );

            await interaction.editReply({ embeds: [invalidEmbed] });
            return;
        }

        const url = `${Options.urlSlothpixelPlayer}/${player}`;

        let response;

        try {
            response = await Request.request(url);
        } catch (error) {
            if (error instanceof HTTPError && error.response?.status === 404) {
                const notFoundEmbed = new BetterEmbed(interaction)
                    .setColor(Options.colorsWarning)
                    .setTitle(i18n.getMessage('commandsRegisterInvalidPlayerTitle'))
                    .setDescription(i18n.getMessage('commandsRegisterInvalidPlayerDescription'));

                this.container.logger.warn(
                    this,
                    Logger.interactionLogContext(interaction),
                    'Invalid player:',
                    player,
                );

                await interaction.editReply({ embeds: [notFoundEmbed] });
                return;
            }

            const slothpixelErrorEmbed = new BetterEmbed(interaction)
                .setColor(Options.colorsWarning)
                .setTitle(i18n.getMessage('commandsRegisterSlothpixelErrorTitle'))
                .setDescription(i18n.getMessage('commandsRegisterSlothpixelErrorDescription'));

            this.container.logger.error(
                this,
                Logger.interactionLogContext(interaction),
                'Slothpixel error.',
                error,
            );

            new RequestErrorHandler(error).init();

            await interaction.editReply({ embeds: [slothpixelErrorEmbed] });
            return;
        }

        const data = (await response.json()) as SlothpixelPlayer;

        const uuids = (
            await this.container.database.users.findMany({
                select: {
                    uuid: true,
                },
            })
        ).map((user) => user.uuid);

        if (uuids.includes(data.uuid)) {
            const alreadyRegisteredEmbed = new BetterEmbed(interaction)
                .setColor(Options.colorsWarning)
                .setTitle(i18n.getMessage('commandsRegisterAlreadyRegisteredTitle'))
                .setDescription(i18n.getMessage('commandsRegisterAlreadyRegisteredDescription'));

            this.container.logger.warn(
                this,
                Logger.interactionLogContext(interaction),
                'UUID already registered.',
            );

            await interaction.editReply({ embeds: [alreadyRegisteredEmbed] });
            return;
        }

        if (data.links.DISCORD === null) {
            const unlinkedEmbed = new BetterEmbed(interaction)
                .setColor(Options.colorsWarning)
                .setTitle(i18n.getMessage('commandsRegisterDiscordUnlinkedTitle'))
                .setDescription(i18n.getMessage('commandsRegisterDiscordUnlinkedDescription'))
                .setImage(Options.urlHypixelDiscord);

            this.container.logger.warn(
                this,
                Logger.interactionLogContext(interaction),
                'Discord not linked.',
            );

            await interaction.editReply({ embeds: [unlinkedEmbed] });
            return;
        }

        if (data.links.DISCORD !== interaction.user.tag) {
            const mismatchedEmbed = new BetterEmbed(interaction)
                .setColor(Options.colorsWarning)
                .setTitle(i18n.getMessage('commandsRegisterDiscordMismatchTitle'))
                .setDescription(i18n.getMessage('commandsRegisterDiscordMismatchDescription'))
                .setImage(Options.urlHypixelDiscord);

            this.container.logger.warn(
                this,
                Logger.interactionLogContext(interaction),
                'Discord mismatch.',
            );

            await interaction.editReply({ embeds: [mismatchedEmbed] });
            return;
        }

        await this.container.database.users.create({
            data: {
                locale: interaction.locale,
                uuid: data.uuid,
                authentication: {
                    create: {
                        id: interaction.user.id,
                        // dummy authentication
                        hash: '',
                        salt: '',
                    },
                },
                friends: {
                    create: {
                        id: interaction.user.id,
                    },
                },
                modules: {
                    create: {
                        id: interaction.user.id,
                    },
                },
                playtime: {
                    create: {
                        id: interaction.user.id,
                    },
                },
                rewards: {
                    create: {
                        id: interaction.user.id,
                    },
                },
            },
        });

        const registeredEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsRegisterSuccessTitle'))
            .setDescription(i18n.getMessage('commandsRegisterSuccessDescription'));

        if (data.last_login === null || data.last_logout === null) {
            registeredEmbed.addFields({
                name: i18n.getMessage('commandsRegisterSuccessAPIWarningFieldName'),
                value: i18n.getMessage('commandsRegisterSuccessAPIWarningFieldValue'),
            });
        }

        registeredEmbed.addFields({
            name: i18n.getMessage('commandsRegisterSuccessNextFieldName'),
            value: i18n.getMessage('commandsRegisterSuccessNextFieldValue'),
        });

        try {
            const testEmbed = new BetterEmbed(interaction)
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('commandsRegisterTestTitle'))
                .setDescription(i18n.getMessage('commandsRegisterTestDescription'));

            await interaction.user.send({ embeds: [testEmbed] });
        } catch (error) {
            if (error instanceof DiscordAPIError && error.code === 50007) {
                registeredEmbed.setColor(Options.colorsOk).unshiftFields({
                    name: i18n.getMessage('commandsRegisterNoDMName'),
                    value: i18n.getMessage('commandsRegisterNoDMValue'),
                });
            }
        }

        this.container.logger.info(
            this,
            Logger.interactionLogContext(interaction),
            'Registration success!',
        );

        await interaction.editReply({ embeds: [registeredEmbed] });

        await setPresence();
    }
}
