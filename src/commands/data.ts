import type { CommandExecute, CommandProperties } from '../@types/client';
import type {
    FriendsModule,
    RawFriendsModule,
    RawRewardsModule,
    RawUserAPIData,
    RewardsModule,
    UserAPIData,
} from '../@types/database';
import { BetterEmbed } from '../util/utility';
import {
    ButtonInteraction,
    CommandInteraction,
    Constants,
    Message,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
} from 'discord.js';
import { RegionLocales } from '../../locales/localesHandler';
import { SQLiteWrapper } from '../database';
import Constants2 from '../util/Constants';
import ErrorHandler from '../util/errors/ErrorHandler';

export const properties: CommandProperties = {
    name: 'data',
    description: 'View and/or delete all data stored or used by this bot',
    usage: '/data [delete/view]',
    cooldown: 30_000,
    ephemeral: true, //Temporary, file preview fails with this on. MessageAttachment is also bugged, completely broken. Doesn't attach ID.
    noDM: false,
    ownerOnly: false,
    structure: {
        name: 'data',
        description: 'View and/or delete all data stored or used by this bot',
        options: [
            {
                name: 'delete',
                type: '1',
                description: 'Delete all of your data',
            },
            {
                name: 'view',
                description: 'View some or all of your data',
                type: '2',
                options: [
                    {
                        name: 'all',
                        type: '1',
                        description: 'Returns a file with all of your data',
                    },
                    {
                        name: 'history',
                        type: '1',
                        description:
                            'Returns an interface that shows your player history',
                    },
                ],
            },
        ],
    },
};

export const execute: CommandExecute = async (
    interaction: CommandInteraction,
    { userData },
): Promise<void> => {
    const locale = RegionLocales.locale(userData.language).commands.data;
    switch (interaction.options.getSubcommand()) {
        case 'delete':
            await dataDelete();
            break;
        case 'all':
            await viewAll();
            break;
        case 'history':
            await viewHistory();
        //No default
    }

    async function dataDelete() {
        const confirmEmbed = new BetterEmbed(interaction)
            .setColor(Constants2.colors.normal)
            .setTitle(locale.delete.confirm.title)
            .setDescription(locale.delete.confirm.description);

        const yesButton = new MessageButton()
            .setCustomId('true')
            .setLabel(locale.delete.yesButton)
            .setStyle(Constants.MessageButtonStyles.SUCCESS);

        const noButton = new MessageButton()
            .setCustomId('false')
            .setLabel(locale.delete.noButton)
            .setStyle(Constants.MessageButtonStyles.DANGER);

        const buttonRow = new MessageActionRow().addComponents(
            yesButton,
            noButton,
        );

        const confirmation = await interaction.editReply({
            embeds: [confirmEmbed],
            components: [buttonRow],
        });

        await interaction.client.channels.fetch(interaction.channelId);

        const componentFilter = (i: MessageComponentInteraction) =>
            interaction.user.id === i.user.id &&
            i.message.id === confirmation.id; //temp changes

        const collector = interaction.channel!.createMessageComponentCollector({
            filter: componentFilter,
            idle: Constants2.ms.second * 30,
            componentType: 'BUTTON',
            max: 1,
        });

        collector.on('collect', async (i: ButtonInteraction) => {
            try {
                yesButton.setDisabled();
                noButton.setDisabled();
                const disabledRow = new MessageActionRow().setComponents(
                    yesButton,
                    noButton,
                );

                if (i.customId === 'true') {
                    Promise.all([
                        SQLiteWrapper.deleteUser({
                            discordID: userData.discordID,
                            table: Constants2.tables.users,
                        }),
                        SQLiteWrapper.deleteUser({
                            discordID: userData.discordID,
                            table: Constants2.tables.api,
                        }),
                        SQLiteWrapper.deleteUser({
                            discordID: userData.discordID,
                            table: Constants2.tables.friends,
                        }),
                        SQLiteWrapper.deleteUser({
                            discordID: userData.discordID,
                            table: Constants2.tables.rewards,
                        }),
                    ]);

                    const aborted = new BetterEmbed(interaction)
                        .setColor(Constants2.colors.normal)
                        .setTitle(locale.delete.deleted.title)
                        .setDescription(locale.delete.deleted.description);
                    await i.update({
                        embeds: [aborted],
                        components: [disabledRow],
                    });
                } else {
                    const aborted = new BetterEmbed(interaction)
                        .setColor(Constants2.colors.normal)
                        .setTitle(locale.delete.aborted.title)
                        .setDescription(locale.delete.aborted.description);
                    await i.update({
                        embeds: [aborted],
                        components: [disabledRow],
                    });
                }
            } catch (error) {
                const handler = new ErrorHandler({
                    error: error,
                    interaction: interaction,
                });

                await handler.systemNotify();
                await handler.userNotify();
            }
        });

        collector.on('end', async (_collected, reason) => {
            try {
                if (reason === 'idle') {
                    yesButton.setDisabled();
                    noButton.setDisabled();
                    const disabledRow = new MessageActionRow().setComponents(
                        yesButton,
                        noButton,
                    );
                    await interaction.editReply({ components: [disabledRow] });
                }
            } catch (error) {
                const handler = new ErrorHandler({
                    error: error,
                    interaction: interaction,
                });

                await handler.systemNotify();
                await handler.userNotify();
            }
        });
    }

    async function viewAll() {
        const data = await Promise.all([
            SQLiteWrapper.getUser<RawUserAPIData, UserAPIData>({
                discordID: userData.discordID,
                table: 'api',
                columns: ['*'],
                allowUndefined: true,
            }) as Promise<UserAPIData>,
            SQLiteWrapper.getUser<RawFriendsModule, FriendsModule>({
                discordID: userData.discordID,
                table: 'friends',
                columns: ['*'],
                allowUndefined: true,
            }) as Promise<FriendsModule>,
            SQLiteWrapper.getUser<RawRewardsModule, RewardsModule>({
                discordID: userData.discordID,
                table: 'rewards',
                columns: ['*'],
                allowUndefined: true,
            }) as Promise<RewardsModule>,
        ]);

        const allUserData = {
            userData: userData,
            userAPIData: data[0],
            friends: data[1],
            rewards: data[2],
        };

        await interaction.editReply({
            files: [
                {
                    attachment: Buffer.from(
                        JSON.stringify(allUserData, null, 2),
                    ),
                    name: 'userData.json',
                },
            ],
        });
    }

    async function viewHistory() {
        const userAPIData = (await SQLiteWrapper.getUser<
            RawUserAPIData,
            UserAPIData
        >({
            discordID: userData.discordID,
            table: Constants2.tables.api,
            columns: ['*'],
            allowUndefined: true,
        })) as UserAPIData;

        const fastLeftButton = new MessageButton()
            .setCustomId('fastBackward')
            .setLabel('<<')
            .setStyle('PRIMARY')
            .setDisabled(true);

        const leftButton = new MessageButton()
            .setCustomId('backward')
            .setLabel('<')
            .setStyle('PRIMARY')
            .setDisabled(true);

        const rightButton = new MessageButton()
            .setCustomId('forward')
            .setLabel('>')
            .setStyle('PRIMARY');

        const fastRightButton = new MessageButton()
            .setCustomId('fastForward')
            .setLabel('>>')
            .setStyle('PRIMARY');

        rightButton.disabled =
            userAPIData.history.length <
            Constants2.defaults.menuFastIncrements;

        fastRightButton.disabled =
            userAPIData.history.length <
            Constants2.defaults.menuFastIncrements;

        const epoch = /^\d{13,}$/gm;

        const paginator = (position: number): BetterEmbed => {
            const data = userAPIData.history;
            const shownData = data.slice(
                position,
                position + Constants2.defaults.menuIncrements,
            );

            const fields = shownData.map(({ date, ...event }) => ({
                name: `<t:${Math.round(date / 1000)}:f>`,
                value: Object.entries(event)
                    .map(([key, value]) =>
                        (String(value).match(epoch)
                            ? `${key}: <t:${Math.round(value / 1000)}:T>`
                            : `${key}: ${value}`),
                    )
                    .join('\n'),
            }));

            return new BetterEmbed(interaction)
                .setColor(Constants2.colors.normal)
                .setDescription(
                    `Showing ${position + 1} to ${
                        position + Constants2.defaults.menuIncrements
                    } of ${userAPIData.history.length}`,
                )
                .setTitle('History')
                .setFields(fields);
        };

        const buttons = new MessageActionRow().setComponents(
            fastLeftButton,
            leftButton,
            rightButton,
            fastRightButton,
        );

        const reply = await interaction.editReply({
            embeds: [paginator(0)],
            components: [buttons],
        });

        await interaction.client.channels.fetch(interaction.channelId);

        const filter = (i: MessageComponentInteraction) =>
            interaction.user.id === i.user.id && i.message.id === reply.id;

        const collector = interaction.channel!.createMessageComponentCollector({
            filter: filter,
            idle: Constants2.ms.minute * 5,
            time: Constants2.ms.minute * 30,
        });

        let currentIndex = 0;

        collector.on('collect', async i => {
            try {
                switch (i.customId) {
                    case 'fastBackward':
                        currentIndex -=
                            Constants2.defaults.menuFastIncrements;
                        break;
                    case 'backward':
                        currentIndex -= Constants2.defaults.menuIncrements;
                        break;
                    case 'forward':
                        currentIndex += Constants2.defaults.menuIncrements;
                        break;
                    case 'fastForward':
                        currentIndex +=
                            Constants2.defaults.menuFastIncrements;
                    //No default
                }

                fastLeftButton.disabled =
                    currentIndex - Constants2.defaults.menuFastIncrements < 0;

                leftButton.disabled =
                    currentIndex - Constants2.defaults.menuIncrements < 0;

                rightButton.disabled =
                    currentIndex + Constants2.defaults.menuIncrements >
                    userAPIData.history.length;

                fastRightButton.disabled =
                    currentIndex + Constants2.defaults.menuFastIncrements >
                    userAPIData.history.length;

                buttons.setComponents(
                    fastLeftButton,
                    leftButton,
                    rightButton,
                    fastRightButton,
                );

                await i.update({
                    embeds: [paginator(currentIndex)],
                    components: [buttons],
                });
            } catch (error) {
                const handler = new ErrorHandler({
                    error: error,
                    interaction: interaction,
                });

                await handler.systemNotify();
                await handler.userNotify();
            }
        });

        collector.on('end', async () => {
            try {
                const { components: actionRows } =
                    (await interaction.fetchReply()) as Message;

                for (const { components } of actionRows) {
                    for (const component of components) {
                        component.disabled = true;
                    }
                }

                await interaction.editReply({
                    components: actionRows,
                });
            } catch (error) {
                const handler = new ErrorHandler({
                    error: error,
                    interaction: interaction,
                });

                await handler.systemNotify();
                await handler.userNotify();
            }
        });
    }
};
