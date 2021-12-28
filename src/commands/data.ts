import type { CommandExecute, CommandProperties } from '../@types/client';
import type {
    FriendsModule,
    RawFriendsModule,
    RawRewardsModule,
    RawUserAPIData,
    RewardsModule,
    UserAPIData,
} from '../@types/database';
import { BetterEmbed, camelToNormal } from '../util/utility';
import { CommandErrorHandler } from '../util/errors/handlers/CommandErrorHandler';
import {
    ButtonInteraction,
    CommandInteraction,
    Constants as DiscordConstants,
    Message,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
} from 'discord.js';
import { RegionLocales } from '../../locales/localesHandler';
import { SQLiteWrapper } from '../database';
import Constants from '../util/Constants';

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
            idle: Constants.ms.second * 30,
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
                            table: Constants.tables.users,
                        }),
                        SQLiteWrapper.deleteUser({
                            discordID: userData.discordID,
                            table: Constants.tables.api,
                        }),
                        SQLiteWrapper.deleteUser({
                            discordID: userData.discordID,
                            table: Constants.tables.friends,
                        }),
                        SQLiteWrapper.deleteUser({
                            discordID: userData.discordID,
                            table: Constants.tables.rewards,
                        }),
                    ]);

                    const aborted = new BetterEmbed(interaction)
                        .setColor(Constants.colors.normal)
                        .setTitle(locale.delete.deleted.title)
                        .setDescription(locale.delete.deleted.description);
                    await i.update({
                        embeds: [aborted],
                        components: [disabledRow],
                    });
                } else {
                    const aborted = new BetterEmbed(interaction)
                        .setColor(Constants.colors.normal)
                        .setTitle(locale.delete.aborted.title)
                        .setDescription(locale.delete.aborted.description);
                    await i.update({
                        embeds: [aborted],
                        components: [disabledRow],
                    });
                }
            } catch (error) {
                const handler = new CommandErrorHandler(error, interaction, userData.language);
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
            table: Constants.tables.api,
            columns: ['*'],
            allowUndefined: false,
        })) as UserAPIData;

        const base = new MessageButton()
            .setStyle(DiscordConstants.MessageButtonStyles.PRIMARY);

        const fastLeftButton = new MessageButton(base)
            .setCustomId('fastBackward')
            .setLabel('<<')
            .setDisabled(true);

        const leftButton = new MessageButton(base)
            .setCustomId('backward')
            .setLabel('<')
            .setDisabled(true);

        const rightButton = new MessageButton(base)
            .setCustomId('forward')
            .setLabel('>');

        const fastRightButton = new MessageButton(base)
            .setCustomId('fastForward')
            .setLabel('>>');

        rightButton.disabled =
            userAPIData.history.length < Constants.defaults.menuFastIncrements;

        fastRightButton.disabled =
            userAPIData.history.length < Constants.defaults.menuFastIncrements;

        const epoch = /^\d{13,}$/gm;

        const paginator = (position: number): BetterEmbed => {
            const data = userAPIData.history;
            const shownData = data.slice(
                position,
                position + Constants.defaults.menuIncrements,
            );

            const fields = shownData.map(({ date, ...event }) => ({
                name: `<t:${Math.round(date / 1000)}:D><t:${Math.round(
                    date / 1000,
                )}:T>`,
                value: Object.entries(event)
                    .map(
                        ([key, value]) =>
                            (String(value).match(epoch)
                                ? `${camelToNormal(key)}: <t:${Math.round(
                                      value / 1000,
                                  )}:T>` //Time values (logins, logouts etc)
                                : `${camelToNormal(key)}: ${value ?? 'None'}`), //Anything else
                    )
                    .join('\n'),
            }));

            return new BetterEmbed(interaction)
                .setColor(Constants.colors.normal)
                .setDescription(
                    `• Showing ${position + 1} to ${
                        position + shownData.length
                    } out of ${userAPIData.history.length}
                    • Saves up to ${
                        Constants.limits.userAPIDataHistory
                    } events`,
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
                    currentIndex + Constants.defaults.menuIncrements >
                    userAPIData.history.length;

                fastRightButton.disabled =
                    currentIndex + Constants.defaults.menuFastIncrements >
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

                for (const { components } of actionRows) {
                    for (const component of components) {
                        component.disabled = true;
                    }
                }

                await interaction.editReply({
                    components: actionRows,
                });
            } catch (error) {
                const handler = new CommandErrorHandler(error, interaction, userData.language);
                await handler.systemNotify();
                await handler.userNotify();
            }
        });
    }
};
