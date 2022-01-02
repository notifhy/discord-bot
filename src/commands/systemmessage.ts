import type {
    CommandExecute,
    CommandProperties,
} from '../@types/client';
import type { UserData } from '../@types/database';
import {
    awaitComponent,
    BetterEmbed,
    disableComponents,
} from '../util/utility';
import {
    CommandInteraction,
    Constants as DiscordConstants,
    Message,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    MessageEmbed,
} from 'discord.js';
import { SQLite } from '../util/SQLite';
import Constants from '../util/Constants';

export const properties: CommandProperties = {
    name: 'systemmessage',
    description: 'Adds a message to a user\'s system messages',
    usage: '/systemmessage',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    structure: {
        name: 'systemmessage',
        description: 'Message a user',
        options: [
            {
                name: 'id',
                type: '3',
                description: 'The user to message',
                required: true,
            },
            {
                name: 'name',
                type: '3',
                description: 'Title of the message',
                required: true,
            },
            {
                name: 'value',
                type: '3',
                description: 'Main content of the message',
                required: true,
            },
        ],
    },
};

export const execute: CommandExecute = async (
    interaction: CommandInteraction,
): Promise<void> => {
    const id = interaction.options.getString('id', true);

    const userData = (
        await SQLite.getUser<UserData>({
            discordID: id,
            table: Constants.tables.users,
            columns: ['systemMessage'],
            allowUndefined: true,
        },
    )) as UserData | undefined;

    if (userData === undefined) {
        const notFoundEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle('User not found')
            .setDescription(`${id} was not found`);

        await interaction.editReply({
            embeds: [notFoundEmbed],
        });

        return;
    }

    const name = interaction.options.getString('name', true);
    const value = interaction.options.getString('value', true);

    const buttons = new MessageActionRow()
        .setComponents(
            new MessageButton()
                .setCustomId('true')
                .setLabel('Looks Good')
                .setStyle(DiscordConstants.MessageButtonStyles.PRIMARY),
        );

    const validateEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle('Preview')
        .setDescription('Your preview is below. To abort, ignore this message.')
        .addField('ID', id)
        .addField(name, value);

    const message = await interaction.editReply({
        embeds: [validateEmbed],
        components: [buttons],
    }) as Message;

    await interaction.client.channels.fetch(interaction.channelId);

    const componentFilter = (i: MessageComponentInteraction) =>
        interaction.user.id === i.user.id &&
        i.message.id === message.id;

    const disabledRows = disableComponents([buttons]);

    const button = await awaitComponent(
        interaction.channel!,
        'BUTTON',
        {
            filter: componentFilter,
            idle: Constants.ms.second * 30,
        },
    );

    if (button === null) {
        await interaction.editReply({
            components: disabledRows,
        });

        return;
    }

    await SQLite.updateUser<UserData>({
        discordID: id,
        table: Constants.tables.users,
        data: {
            systemMessage: [
                {
                    name: name,
                    value: value,
                },
                ...userData.systemMessage,
            ],
        },
    });

    const successEmbed = new MessageEmbed(validateEmbed)
        .setTitle('Success')
        .setDescription('Your message was queued.');

     await button.update({
        embeds: [successEmbed],
        components: disabledRows,
    });
};