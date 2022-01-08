import type { ClientCommand } from '../@types/client';
import type {
    FriendsModule,
    RewardsModule,
    UserAPIData,
} from '../@types/database';
import {
    awaitComponent,
    BetterEmbed,
    capitolToNormal,
    cleanGameMode,
    disableComponents,
    timestamp,
} from '../util/utility';
import { Buffer } from 'node:buffer';
import {
    CommandInteraction,
    Constants as DiscordConstants,
    Message,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
} from 'discord.js';
import { Log } from '../util/Log';
import { RegionLocales } from '../../locales/localesHandler';
import { SQLite } from '../util/SQLite';
import CommandErrorHandler from '../util/errors/handlers/CommandErrorHandler';
import Constants from '../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'data',
    description: 'View and/or delete all data stored or used by this bot',
    cooldown: 30_000,
    ephemeral: true, //File preview fails with ephemeral
    noDM: false,
    ownerOnly: false,
    structure: {
        name: 'data',
        description: 'View and/or delete all data stored or used by this bot',
        options: [
            {
                name: 'delete',
                type: 1,
                description: 'Delete all of your data - there is a confirmation step to prevent accidents',
            },
            {
                name: 'view',
                description: 'View some or all of your data',
                type: 2,
                options: [
                    {
                        name: 'all',
                        type: 1,
                        description: 'Returns a file with all of your data',
                    },
                    {
                        name: 'history',
                        type: 1,
                        description:
                            'Returns an interface that shows your player history',
                    },
                ],
            },
        ],
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction: CommandInteraction,
    { userData },
): Promise<void> => {
    const locale = RegionLocales.locale(userData.language).commands.data;
    const { replace } = RegionLocales;

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
            .setColor(Constants.colors.normal)
            .setTitle(locale.delete.confirm.title)
            .setDescription(locale.delete.confirm.description);

        const yesButton = new MessageButton()
            .setCustomId('true')
            .setLabel(locale.delete.yesButton)
            .setStyle(DiscordConstants.MessageButtonStyles.SUCCESS);

        const noButton = new MessageButton()
            .setCustomId('false')
            .setLabel(locale.delete.noButton)
            .setStyle(DiscordConstants.MessageButtonStyles.DANGER);

        const buttonRow = new MessageActionRow().addComponents(
            yesButton,
            noButton,
        );

        const message = await interaction.editReply({
            embeds: [confirmEmbed],
            components: [buttonRow],
        }) as Message;

        const disabledRows = disableComponents(message.components);

        await interaction.client.channels.fetch(interaction.channelId);

        const componentFilter = (i: MessageComponentInteraction) =>
            interaction.user.id === i.user.id &&
            i.message.id === message.id;

        const button = await awaitComponent(
            interaction.channel!,
            'BUTTON',
            {
                filter: componentFilter,
                idle: Constants.ms.second * 30,
            },
        );

        if (button === null) {
            Log.command(interaction, 'Ran out of time');

            await interaction.editReply({
                components: disabledRows,
            });
        } else if (button.customId === 'true') {
            Promise.all([
                SQLite.deleteUser({
                    discordID: userData.discordID,
                    table: Constants.tables.users,
                }),
                SQLite.deleteUser({
                    discordID: userData.discordID,
                    table: Constants.tables.api,
                }),
                SQLite.deleteUser({
                    discordID: userData.discordID,
                    table: Constants.tables.friends,
                }),
                SQLite.deleteUser({
                    discordID: userData.discordID,
                    table: Constants.tables.rewards,
                }),
            ]);

            const deleted = new BetterEmbed(interaction)
                .setColor(Constants.colors.normal)
                .setTitle(locale.delete.deleted.title)
                .setDescription(locale.delete.deleted.description);

            Log.command(interaction, 'Accepted data deletion');

            await button.update({
                embeds: [deleted],
                components: disabledRows,
            });
        } else {
            const aborted = new BetterEmbed(interaction)
                .setColor(Constants.colors.normal)
                .setTitle(locale.delete.aborted.title)
                .setDescription(locale.delete.aborted.description);

            Log.command(interaction, 'Aborted data deletion');

            await button.update({
                embeds: [aborted],
                components: disabledRows,
            });
        }
    }

    async function viewAll() {
        const data = await Promise.all([
            SQLite.getUser<UserAPIData>({
                discordID: userData.discordID,
                table: Constants.tables.api,
                columns: ['*'],
                allowUndefined: true,
            })!,
            SQLite.getUser<FriendsModule>({
                discordID: userData.discordID,
                table: Constants.tables.friends,
                columns: ['*'],
                allowUndefined: true,
            })!,
            SQLite.getUser<RewardsModule>({
                discordID: userData.discordID,
                table: Constants.tables.rewards,
                columns: ['*'],
                allowUndefined: true,
            })!,
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
        const userAPIData = (
            await SQLite.getUser<
                UserAPIData
            >({
                discordID: userData.discordID,
                table: Constants.tables.api,
                columns: ['*'],
                allowUndefined: false,
            })
        ) as UserAPIData;

        const base = new MessageButton()
            .setStyle(
                DiscordConstants.MessageButtonStyles.PRIMARY,
            );

        const fastLeftButton = new MessageButton(base)
            .setCustomId('fastBackward')
            .setEmoji(Constants.emoji.fastBackward)
            .setDisabled(true);

        const leftButton = new MessageButton(base)
            .setCustomId('backward')
            .setEmoji(Constants.emoji.backward)
            .setDisabled(true);

        const rightButton = new MessageButton(base)
            .setCustomId('forward')
            .setEmoji(Constants.emoji.forward);

        const fastRightButton = new MessageButton(base)
            .setCustomId('fastForward')
            .setEmoji(Constants.emoji.fastForward);

        rightButton.disabled =
            userAPIData.history.length <= Constants.defaults.menuFastIncrements;

        fastRightButton.disabled =
            userAPIData.history.length <= Constants.defaults.menuIncrements;

        const keys = locale.history.keys;
        const epoch = /^\d{13,}$/gm;

        const paginator = (position: number): BetterEmbed => {
            const data = userAPIData.history;
            const shownData = data.slice(
                position,
                position + Constants.defaults.menuIncrements,
            );

            const fields = shownData.map(({ date, ...event }) => ({
                name: `${timestamp(date, 'D')}${timestamp(date, 'T')}`,
                value: Object.entries(event)
                    .map(
                        ([key, value]) =>
                            `${keys[key as keyof typeof keys]} ${String(value).match(epoch)
                                ? timestamp(value, 'T')
                                : (
                                    key === 'gameMode'
                                        ? cleanGameMode(value) ?? locale.history.null
                                        : capitolToNormal(value) ?? locale.history.null
                                )}`,
                    )
                    .join('\n'),
            }));

            return new BetterEmbed(interaction)
                .setColor(Constants.colors.normal)
                .setTitle(locale.history.embed.title)
                .setDescription(replace(locale.history.embed.description, {
                    start: position >= userAPIData.history.length
                        ? position
                        : position + 1,
                    end: position + shownData.length,
                    total: userAPIData.history.length,
                    max: Constants.limits.userAPIDataHistory,
                }))
                .setFields(fields);
        };

        const buttons = new MessageActionRow()
            .setComponents(
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
            idle: Constants.ms.minute * 5,
            time: Constants.ms.minute * 30,
        });

        let currentIndex = 0;

        collector.on('collect', async i => {
            try {
                switch (i.customId) {
                    case 'fastBackward':
                        currentIndex -= Constants.defaults.menuFastIncrements;
                        break;
                    case 'backward':
                        currentIndex -= Constants.defaults.menuIncrements;
                        break;
                    case 'forward':
                        currentIndex += Constants.defaults.menuIncrements;
                        break;
                    case 'fastForward':
                        currentIndex += Constants.defaults.menuFastIncrements;
                    //No default
                }

                fastLeftButton.disabled =
                    currentIndex - Constants.defaults.menuFastIncrements < 0;

                leftButton.disabled =
                    currentIndex - Constants.defaults.menuIncrements < 0;

                rightButton.disabled =
                    currentIndex + Constants.defaults.menuIncrements >=
                    userAPIData.history.length;

                fastRightButton.disabled =
                    currentIndex + Constants.defaults.menuFastIncrements >=
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
                const handler = new CommandErrorHandler(error, interaction, userData.language);
                await handler.systemNotify();
                await handler.userNotify();
            }
        });

        collector.on('end', async () => {
            try {
                const message = (await interaction.fetchReply()) as Message;
                const actionRows = message.components;
                const disabledRows = disableComponents(actionRows);

                await interaction.editReply({
                    components: disabledRows,
                });
            } catch (error) {
                const handler = new CommandErrorHandler(error, interaction, userData.language);
                await handler.systemNotify();
                await handler.userNotify();
            }
        });
    }
};
