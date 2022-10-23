import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import {
    type ButtonInteraction,
    type CommandInteraction,
    MessageActionRow,
    MessageButton,
    type MessageComponentInteraction,
    MessageSelectMenu,
    SnowflakeUtil,
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
            description: 'Displays helpful information and available commands',
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

    public override async chatInputRun(interaction: CommandInteraction) {
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

        const informationSnowflake = SnowflakeUtil.generate();
        const commandsSnowflake = SnowflakeUtil.generate();

        const informationButton = new MessageButton()
            .setCustomId(informationSnowflake)
            .setStyle('PRIMARY')
            .setLabel(i18n.getMessage('commandsHelpInformationLabel'));

        const commandsButton = new MessageButton()
            .setCustomId(commandsSnowflake)
            .setStyle('PRIMARY')
            .setLabel(i18n.getMessage('commandsHelpCommandsLabel'));

        const row = new MessageActionRow().setComponents(informationButton, commandsButton);

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
            componentType: 'BUTTON',
            filter: componentFilter,
            idle: Time.Minute,
        });

        if (selectMenuInteraction === null) {
            const disabledRows = disableComponents([row]);

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
            // no default
        }
    }

    public async informationMenu(interaction: CommandInteraction, component: ButtonInteraction) {
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

    public async commandsMenu(interaction: CommandInteraction, component: ButtonInteraction) {
        const { i18n } = interaction;

        const commands = this.container.stores
            .get('commands')
            .filter(
                (command) => typeof command.options.preconditions?.find(
                    (condition) => condition === 'OwnerOnly',
                ) === 'undefined',
            );

        const snowflake = SnowflakeUtil.generate();

        let selectedCommand = commands.first()!;

        const commandsSelectMenu = () => new MessageSelectMenu().setCustomId(snowflake).setOptions(
            ...commands.map((command) => ({
                label: i18n.getMessage('commandsHelpCommandsMenuLabel', [
                    i18n.getChatInputName(command),
                ]),
                description: i18n.getChatInputDescription(command),
                value: i18n.getChatInputName(command),
                default: command.name === selectedCommand.name,
            })),
        );

        const row = () => new MessageActionRow().setComponents(commandsSelectMenu());

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
            componentType: 'SELECT_MENU',
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
            const disabledRows = disableComponents([row()]);

            await interaction.editReply({
                components: disabledRows,
            });
        });
    }

    public generateCommandResponse(interaction: CommandInteraction, command: Command) {
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
