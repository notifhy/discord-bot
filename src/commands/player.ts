import type { ClientCommand } from '../@types/client';
import type {
    PlayerDB,
    SlothpixelPlayer,
    SlothpixelRecentGames,
    SlothpixelStatus,
} from '../@types/hypixel';
import {
    BetterEmbed,
    cleanLength,
    disableComponents,
    timestamp,
} from '../util/utility';
import {
    Constants as DiscordConstants,
    Formatters,
    Message,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
} from 'discord.js';
import { Log } from '../util/Log';
import { RegionLocales } from '../../locales/localesHandler';
import { Request } from '../util/Request';
import Constants from '../util/Constants';
import HTTPError from '../util/errors/HTTPError';
import CommandErrorHandler from '../util/errors/handlers/CommandErrorHandler';

export const properties: ClientCommand['properties'] = {
    name: 'player',
    description: 'View data on almost any Hypixel player',
    cooldown: 10_000,
    ephemeral: true,
    noDM: false,
    ownerOnly: false,
    structure: {
        name: 'player',
        description: 'View data on almost any Hypixel player',
        options: [
            {
                name: 'status',
                type: 1,
                description: 'Displays general information about the player',
                options: [
                    {
                        name: 'player',
                        type: 3,
                        description: 'The UUID or username to search',
                        required: true,
                    },
                ],
            },
            {
                name: 'recentgames',
                description: 'Displays the player\'s recently played games',
                type: 1,
                options: [
                    {
                        name: 'player',
                        type: 3,
                        description: 'The UUID or username to search',
                        required: true,
                    },
                ],
            },
        ],
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const text = RegionLocales.locale(locale).commands.player;
    const replace = RegionLocales.replace;
    const unknown = text.unknown;

    const inputUUID =
        /^[0-9a-f]{8}(-?)[0-9a-f]{4}(-?)[1-5][0-9a-f]{3}(-?)[89AB][0-9a-f]{3}(-?)[0-9a-f]{12}$/i;
    const inputUsername = /^[a-zA-Z0-9_-]{1,24}$/g;
    const input = interaction.options.getString('player', true);
    const inputType = inputUUID.test(input) === true ? 'UUID' : 'username';

    if (
        inputUUID.test(input) === false &&
        inputUsername.test(input) === false
    ) {
        const invalidEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(text.invalid.title)
            .setDescription(text.invalid.description);

        Log.command(interaction, 'Invalid user:', input);

        await interaction.editReply({ embeds: [invalidEmbed] });
        return;
    }

    switch (interaction.options.getSubcommand()) {
        case 'status': await status();
            break;
        case 'recentgames': await recentgames();
            break;
        //No default
    }

    async function status() {
        const responses = await Promise.all([
            fetch(),
            fetch('/status'),
        ]);

        if (
            responses[0].status === 404 ||
            responses[1].status === 404
        ) {
            await notFound();
            return;
        }

        const {
            uuid,
            username,
            last_login,
            last_logout,
            last_game,
            mc_version,
            language,
            links: {
                TWITTER,
                INSTAGRAM,
                TWITCH,
                DISCORD,
                HYPIXEL,
            },
        } = (await responses[0].json()) as SlothpixelPlayer;

        const {
            online,
            game: {
                type,
                mode,
                map,
            },
        } = (await responses[1].json()) as SlothpixelStatus;

        const statusEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(text.status.embed.title)
            .setDescription(
                replace(text.status.embed.field1.value, {
                    username: username,
                    status: online === true
                        ? text.status.online
                        : text.status.offline,
                }))
            .addField(
                text.status.embed.field1.name,
                replace(text.status.embed.field1.value, {
                    uuid: uuid,
                    TWITTER: TWITTER ?? unknown,
                    INSTAGRAM: INSTAGRAM ?? unknown,
                    TWITCH: TWITCH ?? unknown,
                    DISCORD: DISCORD ?? unknown,
                    HYPIXEL: HYPIXEL
                        ? Formatters.hyperlink('link', HYPIXEL)
                        : unknown,
                }))
            .addField(
                text.status.embed.field2.name,
                replace(text.status.embed.field2.value, {
                    lastLogin: timestamp(last_login, 'F') ?? unknown,
                    lastLogout: timestamp(last_logout, 'F') ?? unknown,
                }));

        if (online === true) {
            statusEmbed
                .addField(
                    text.status.embed.onlineField.name,
                    replace(text.status.embed.onlineField.value, {
                        playTime: cleanLength(
                            Date.now() - Number(last_login),
                        ) ?? unknown,
                        gameType: type ?? unknown,
                        gameMode: mode ?? unknown,
                        gameMap: map ?? unknown,
                    }));
        } else {
            statusEmbed
                .addField(
                    text.status.embed.offlineField.name,
                    replace(text.status.embed.offlineField.value, {
                        playTime: cleanLength(
                            Number(last_logout) - Number(last_login),
                        ) ?? unknown,
                        gameType: last_game ?? unknown,
                    }));
        }

        statusEmbed
            .addField(
                text.status.embed.field3.name,
                replace(text.status.embed.field3.value, {
                    language: language ?? 'ENGLISH',
                    version: mc_version ?? unknown,
                }));

        await interaction.editReply({ embeds: [statusEmbed] });
    }

    async function recentgames() {
        const responses = await Promise.all([
            fetch('/recentGames'),
            new Request().request(`${Constants.urls.playerDB}${input}`),
        ]);

        if (
            responses[0].status === 404 ||
            responses[1].status === 500
        ) {
            await notFound();
            return;
        }

        const recentGames =
            (await responses[0].json()) as SlothpixelRecentGames;

        const { username } =
            ((await responses[1].json()) as PlayerDB).data.player;

        const base = new MessageButton()
            .setStyle(
                DiscordConstants.MessageButtonStyles.PRIMARY,
            );

        const paginator = (position: number): BetterEmbed => {
            const shownData = recentGames.slice(
                position,
                position + Constants.defaults.menuIncrements,
            );

            const fields = shownData.map(({ date, ended, gameType, mode, map }) => ({
                name: replace(text.recentGames.embed.field.name, {
                    gameType: gameType,
                    date: timestamp(date, 'D') ?? unknown,
                }),
                value: replace(text.recentGames.embed.field.value, {
                    start: timestamp(date, 'T') ?? unknown,
                    end: timestamp(ended, 'T') ?? text.recentGames.inProgress,
                    playTime: ended
                        ? `${text.recentGames.playTime}${cleanLength(ended - date)}`
                        : `${text.recentGames.elapsed}${cleanLength(Date.now() - date)}`,
                    mode: mode
                        ? `\n${text.recentGames.gameMode}${mode}`
                        : '',
                    map: map
                        ? `\n${text.recentGames.gameMap}${map}`
                        : '',
                }),
            }));

            return new BetterEmbed(interaction)
                .setColor(Constants.colors.normal)
                .setTitle(replace(text.recentGames.embed.title, {
                    username: username,
                }))
                .setDescription(replace(text.recentGames.embed.description, {
                    start: position >= shownData.length
                        ? position
                        : position + 1,
                    end: position + shownData.length,
                    total: recentGames.length,
                }))
                .setFields(fields);
        };

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
            recentGames.length <= Constants.defaults.menuIncrements;

        fastRightButton.disabled =
            recentGames.length <= Constants.defaults.menuFastIncrements;

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
                    recentGames.length;

                fastRightButton.disabled =
                    currentIndex + Constants.defaults.menuFastIncrements >=
                    recentGames.length;

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
                const handler = new CommandErrorHandler(error, interaction, locale);
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
                const handler = new CommandErrorHandler(error, interaction, locale);
                await handler.systemNotify();
                await handler.userNotify();
            }
        });
    }

    async function fetch(modifier?: string) {
        const url = `${Constants.urls.slothpixel}players/${input}${modifier ?? ''}`;
        const response = await new Request().request(url);

        if (response.status === 404) {
            return response;
        }

        if (response.ok === false) {
            throw new HTTPError({
                message: response.statusText,
                response: response,
                url: url,
            });
        }

        return response;
    }

    async function notFound() {
        const notFoundEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle(text.notFound.title)
            .setDescription(
                replace(text.notFound.description, {
                    inputType: inputType,
                }),
            );

        Log.command(interaction, 'User not found', input);

        await interaction.editReply({ embeds: [notFoundEmbed] });
    }
};