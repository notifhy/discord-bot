import { ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import {
    CommandInteraction,
    Constants,
    Message,
    MessageActionRow,
    MessageButton,
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
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    options: [
                        {
                            name: 'name',
                            type: 3,
                            description: 'The title of the message',
                            required: true,
                        },
                        {
                            name: 'value',
                            type: 3,
                            description: 'The content of the message',
                            required: true,
                        },
                    ],
                },
                {
                    name: 'single',
                    description: 'Create a system message for a single user',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    options: [
                        {
                            name: 'id',
                            type: 3,
                            description: 'The Id of the user',
                            required: true,
                        },
                        {
                            name: 'name',
                            type: 3,
                            description: 'The title of the message',
                            required: true,
                        },
                        {
                            name: 'value',
                            type: 3,
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

    public override async chatInputRun(interaction: CommandInteraction) {
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

    private async all(interaction: CommandInteraction) {
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

    private async single(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const id = interaction.options.getString('id', true);

        const user = await this.container.database.users.findUnique({
            where: {
                id: interaction.user.id,
            },
        });

        if (user === null) {
            const invalidUserEmbed = new BetterEmbed(interaction)
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('commandsSystemMessageSingleInvalidUserTitle'))
                .setDescription(
                    i18n.getMessage('commandsSystemMessageSingleInvalidUserDescription', [id]),
                );

            await interaction.editReply({
                embeds: [invalidUserEmbed],
            });

            return;
        }

        await this.create(interaction, [id]);
    }

    private async create(interaction: CommandInteraction, ids: string[]) {
        const { i18n } = interaction;

        const name = interaction.options.getString('name', true);
        const value = interaction.options.getString('value', true);

        const yesButton = new MessageButton()
            .setCustomId('true')
            .setLabel(i18n.getMessage('yes'))
            .setStyle(Constants.MessageButtonStyles.SUCCESS);

        const noButton = new MessageButton()
            .setCustomId('false')
            .setLabel(i18n.getMessage('no'))
            .setStyle(Constants.MessageButtonStyles.DANGER);

        const buttons = new MessageActionRow().addComponents(yesButton, noButton);

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
            componentType: Constants.MessageComponentTypes.BUTTON,
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

        if (button.customId === noButton.customId) {
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
                name: name,
                timestamp: Date.now(),
                value: value,
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
