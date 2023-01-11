import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import {
    ActionRow,
    ActionRowBuilder,
    ButtonBuilder,
    type ButtonInteraction,
    ButtonStyle,
    type ChatInputCommandInteraction,
    ComponentType,
    MessageActionRowComponent,
    type MessageComponentInteraction,
    SnowflakeUtil,
    StringSelectMenuBuilder,
} from 'discord.js';
import { Time } from '../enums/Time';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Options } from '../utility/Options';
import { awaitComponent, disableComponents } from '../utility/utility';

export class HelpCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'help',
            description: 'Display helpful information and available commands',
            cooldownLimit: 1,
            cooldownDelay: Time.Second * 10,
            cooldownScope: BucketScope.User,
            preconditions: ['Base', 'DevMode'],
            requiredUserPermissions: [],
            requiredClientPermissions: [],
        });

        this.chatInputStructure = {
            name: this.name,
            description: this.description,
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        const helpEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsHelpTitle'))
            .addFields(
                {
                    name: i18n.getMessage('commandsHelpInformationName'),
                    value: i18n.getMessage('commandsHelpInformationValue'),
                },
                {
                    name: i18n.getMessage('commandsHelpCommandsName'),
                    value: i18n.getMessage('commandsHelpCommandsValue'),
                },
            );

        const informationSnowflake = SnowflakeUtil.generate().toString();
        const commandsSnowflake = SnowflakeUtil.generate().toString();

        const informationButton = new ButtonBuilder()
            .setCustomId(informationSnowflake)
            .setStyle(ButtonStyle.Primary)
            .setLabel(i18n.getMessage('commandsHelpInformationLabel'));

        const commandsButton = new ButtonBuilder()
            .setCustomId(commandsSnowflake)
            .setStyle(ButtonStyle.Primary)
            .setLabel(i18n.getMessage('commandsHelpCommandsLabel'));

        const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
            informationButton,
            commandsButton,
        );

        const reply = await interaction.editReply({
            embeds: [helpEmbed],
            components: [row],
        });

        await interaction.client.channels.fetch(interaction.channelId);

        // eslint-disable-next-line arrow-body-style
        const componentFilter = (i: MessageComponentInteraction) => {
            return interaction.user.id === i.user.id && i.message.id === reply.id;
        };

        const selectMenuInteraction = await awaitComponent(interaction.channel!, {
            componentType: ComponentType.Button,
            filter: componentFilter,
            idle: Time.Minute,
        });

        if (selectMenuInteraction === null) {
            const disabledRows = disableComponents(reply.components);

            await interaction.editReply({
                components: disabledRows,
            });

            return;
        }

        switch (selectMenuInteraction.customId) {
            case informationSnowflake:
                await this.informationMenu(interaction, selectMenuInteraction);
                break;
            case commandsSnowflake:
                await this.commandsMenu(interaction, selectMenuInteraction);
                break;
            default:
                throw new RangeError();
        }
    }

    public async informationMenu(
        interaction: ChatInputCommandInteraction,
        component: ButtonInteraction,
    ) {
        const { i18n } = interaction;

        const informationMenuEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsHelpInformationMenuTitle'))
            .addFields(
                {
                    name: i18n.getMessage('commandsHelpInformationMenuAboutName'),
                    value: i18n.getMessage('commandsHelpInformationMenuAboutValue'),
                },
                {
                    name: i18n.getMessage('commandsHelpInformationMenuLegalName'),
                    value: i18n.getMessage('commandsHelpInformationMenuLegalValue'),
                },
            );

        await component.update({
            embeds: [informationMenuEmbed],
            components: [],
        });
    }

    public async commandsMenu(
        interaction: ChatInputCommandInteraction,
        component: ButtonInteraction,
    ) {
        const { i18n } = interaction;

        const commands = this.container.stores
            .get('commands')
            .filter(
                (command) => typeof command.options.preconditions?.find(
                    (condition) => condition === 'OwnerOnly',
                ) === 'undefined',
            );

        const snowflake = SnowflakeUtil.generate().toString();

        let selectedCommand = commands.first()!;

        const commandsSelectMenu = () => new StringSelectMenuBuilder()
            .setCustomId(snowflake).setOptions(
                ...commands.map((command) => ({
                    label: i18n.getMessage('commandsHelpCommandsMenuLabel', [
                        i18n.getChatInputName(command),
                    ]),
                    description: i18n.getChatInputDescription(command),
                    value: i18n.getChatInputName(command),
                    default: command.name === selectedCommand.name,
                })),
            );

        const row = () => new ActionRowBuilder<StringSelectMenuBuilder>()
            .setComponents(commandsSelectMenu());

        const reply = await component.update({
            embeds: [this.generateCommandResponse(interaction, selectedCommand)],
            components: [row()],
            fetchReply: true,
        });

        // eslint-disable-next-line arrow-body-style
        const componentFilter = (i: MessageComponentInteraction) => {
            return (
                interaction.user.id === i.user.id
                && i.message.id === reply.id
                && i.customId === snowflake
            );
        };

        const collector = interaction.channel!.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            filter: componentFilter,
            idle: Time.Minute,
            time: Time.Minute * 30,
        });

        collector.on('collect', async (componentInteraction) => {
            selectedCommand = commands.get(componentInteraction.values[0]!)!;

            await componentInteraction.update({
                embeds: [this.generateCommandResponse(interaction, selectedCommand)],
                components: [row()],
            });
        });

        collector.on('end', async () => {
            const disabledRows = disableComponents([
                row().data as ActionRow<MessageActionRowComponent>,
            ]);

            await interaction.editReply({
                components: disabledRows,
            });
        });
    }

    public generateCommandResponse(interaction: ChatInputCommandInteraction, command: Command) {
        const { i18n } = interaction;

        const commandEmbed = new BetterEmbed(interaction).setColor(Options.colorsNormal);

        commandEmbed.setTitle(
            i18n.getMessage('commandsHelpCommandsMenuTitle', [i18n.getChatInputName(command)]),
        );

        commandEmbed.setDescription(
            i18n.getMessage('commandsHelpCommandsMenuDescription', [command.description]),
        );

        commandEmbed.addFields({
            name: i18n.getMessage('commandsHelpCommandsMenuCooldownName'),
            value: i18n.getMessage('commandsHelpCommandsMenuCooldownValue', [
                command.options.cooldownLimit!,
                command.options.cooldownDelay! / Time.Second,
            ]),
        });

        const guildOnly = command.options.preconditions?.find(
            (condition) => condition === 'GuildOnly',
        );

        const ownerOnly = command.options.preconditions?.find(
            (condition) => condition === 'OwnerOnly',
        );

        if (typeof guildOnly !== 'undefined') {
            commandEmbed.addFields({
                name: i18n.getMessage('commandsHelpCommandsMenuDMName'),
                value: i18n.getMessage('commandsHelpCommandsMenuDMValue'),
            });
        }

        if (typeof ownerOnly !== 'undefined') {
            commandEmbed.addFields({
                name: i18n.getMessage('commandsHelpCommandsMenuOwnerName'),
                value: i18n.getMessage('commandsHelpCommandsMenuOwnerValue'),
            });
        }

        return commandEmbed;
    }
}
