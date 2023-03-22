import { ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import {
    ActionRowBuilder,
    APIButtonComponentWithCustomId,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    Message,
    MessageComponentInteraction,
} from 'discord.js';
import { Time } from '../enums/Time';
import { Options } from '../utility/Options';
import { awaitComponent, disableComponents } from '../utility/utility';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Logger } from '../structures/Logger';

export class SystemMessageCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'systemmessage',
            description: 'Create a system message',
            cooldownLimit: 0,
            cooldownDelay: 0,
            cooldownScope: BucketScope.User,
            preconditions: ['Base', 'DevMode', 'OwnerOnly'],
            requiredUserPermissions: [],
            requiredClientPermissions: [],
        });

        this.chatInputStructure = {
            name: this.name,
            description: this.description,
            options: [
                {
                    name: 'all',
                    description: 'Create a system message for all users',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'name',
                            type: ApplicationCommandOptionType.String,
                            description: 'The title of the message',
                            required: true,
                        },
                        {
                            name: 'value',
                            type: ApplicationCommandOptionType.String,
                            description: 'The content of the message',
                            required: true,
                        },
                    ],
                },
                {
                    name: 'single',
                    description: 'Create a system message for a single user',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'id',
                            type: ApplicationCommandOptionType.User,
                            description: 'The Id of the user',
                            required: true,
                        },
                        {
                            name: 'name',
                            type: ApplicationCommandOptionType.String,
                            description: 'The title of the message',
                            required: true,
                        },
                        {
                            name: 'value',
                            type: ApplicationCommandOptionType.String,
                            description: 'The content of the message',
                            required: true,
                        },
                    ],
                },
            ],
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case 'all':
                await this.all(interaction);
                break;
            case 'single':
                await this.single(interaction);
                break;
            // no default
        }
    }

    private async all(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        const users = await this.container.database.users.findMany({
            select: {
                id: true,
            },
        });

        if (users.length === 0) {
            const invalidUserEmbed = new BetterEmbed(interaction)
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('commandsSystemMessageAllNoUsersTitle'))
                .setDescription(i18n.getMessage('commandsSystemMessageAllNoUsersDescription'));

            await interaction.editReply({
                embeds: [invalidUserEmbed],
            });

            return;
        }

        const ids = users.map((user) => user.id);

        await this.create(interaction, ids);
    }

    private async single(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        const user = interaction.options.getUser('id', true);

        const dbUser = await this.container.database.users.findUnique({
            where: {
                id: user.id,
            },
        });

        if (dbUser === null) {
            const invalidUserEmbed = new BetterEmbed(interaction)
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('commandsSystemMessageSingleInvalidUserTitle'))
                .setDescription(
                    i18n.getMessage('commandsSystemMessageSingleInvalidUserDescription', [user.id]),
                );

            await interaction.editReply({
                embeds: [invalidUserEmbed],
            });

            return;
        }

        await this.create(interaction, [dbUser.id]);
    }

    private async create(interaction: ChatInputCommandInteraction, ids: string[]) {
        const { i18n } = interaction;

        const name = interaction.options.getString('name', true);
        const value = interaction.options.getString('value', true);

        const yesButton = new ButtonBuilder()
            .setCustomId('true')
            .setLabel(i18n.getMessage('yes'))
            .setStyle(ButtonStyle.Success);

        const noButton = new ButtonBuilder()
            .setCustomId('false')
            .setLabel(i18n.getMessage('no'))
            .setStyle(ButtonStyle.Danger);

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(yesButton, noButton);

        const previewEmbed = new BetterEmbed()
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsSystemMessagePreviewTitle'))
            .setDescription(i18n.getMessage('commandsSystemMessagePreviewDescription'))
            .setFields(
                {
                    name: i18n.getMessage('commandsSystemMessagePreviewFieldIdsName'),
                    value: ids.join(', '),
                },
                {
                    name: name,
                    value: value,
                },
            );

        const message = (await interaction.editReply({
            embeds: [previewEmbed],
            components: [buttons],
        })) as Message;

        await interaction.client.channels.fetch(interaction.channelId);

        // eslint-disable-next-line arrow-body-style
        const componentFilter = (i: MessageComponentInteraction) => {
            return interaction.user.id === i.user.id && i.message.id === message.id;
        };

        const disabledRows = disableComponents(message.components);

        const button = await awaitComponent(interaction.channel!, {
            componentType: ComponentType.Button,
            filter: componentFilter,
            idle: Time.Second * 30,
        });

        if (button === null) {
            this.container.logger.info(
                this,
                Logger.interactionLogContext(interaction),
                'Ran out of time.',
            );

            await interaction.editReply({
                components: disabledRows,
            });

            return;
        }

        if (button.customId === (noButton.data as APIButtonComponentWithCustomId).custom_id) {
            this.container.logger.info(
                this,
                Logger.interactionLogContext(interaction),
                'Pressed no.',
            );

            await button.update({
                components: disabledRows,
            });

            return;
        }

        this.container.logger.info(
            this,
            Logger.interactionLogContext(interaction),
            `Creating for ${ids.length} users.`,
            `Name: ${name}.`,
            `Value: ${value}.`,
            `Ids: ${ids.join(', ')}.`,
        );

        await this.container.database.system_messages.createMany({
            data: ids.map((id) => ({
                id: id,
                timestamp: Date.now(),
                name_key: 'blank',
                name_variables: [name],
                value_key: 'blank',
                value_variables: [value],
            })),
        });

        const success = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsSystemMessageSuccessTitle'))
            .setDescription(i18n.getMessage('commandsSystemMessageSuccessDescription'));

        await button.update({
            embeds: [success],
            components: disabledRows,
        });
    }
}
