import type {
    EventProperties,
    ClientCommand,
} from '../@types/client';
import type {
    UserAPIData,
    UserData,
} from '../@types/database';
import {
    BetterEmbed,
    slashCommandResolver,
} from '../util/utility';
import {
    Collection,
    CommandInteraction,
    Constants as DiscordConstants,
    DiscordAPIError,
} from 'discord.js';
import { Log } from '../util/Log';
import { ownerID } from '../../config.json';
import { RegionLocales } from '../../locales/localesHandler';
import { SQLite } from '../util/SQLite';
import CommandErrorHandler from '../util/errors/handlers/CommandErrorHandler';
import Constants from '../util/errors/Constants';
import ConstraintError from '../util/errors/ConstraintError';

export const properties: EventProperties = {
    name: 'interactionCreate',
    once: false,
};

export const execute = async (
    interaction: CommandInteraction,
): Promise<void> => {
    try {
        if (interaction.isCommand()) {
            const command: ClientCommand | undefined =
                interaction.client.commands.get(interaction.commandName);
            if (command === undefined) {
                return;
            }

            Log.command(interaction, slashCommandResolver(interaction));

            await interaction.deferReply({
                ephemeral: command.properties.ephemeral,
            });

            const userAPIData = (
                await SQLite.getUser<UserAPIData>({
                    discordID: interaction.user.id,
                    table: Constants.tables.api,
                    columns: ['*'],
                    allowUndefined: true,
                },
            ));

            let userData = (
                await SQLite.getUser<UserData>({
                    discordID: interaction.user.id,
                    table: Constants.tables.users,
                    columns: ['*'],
                    allowUndefined: true,
                },
            ));

            userData ??= (
                await SQLite.newUser<UserData>({
                    table: Constants.tables.users,
                    returnNew: true,
                    data: {
                        discordID: interaction.user.id,
                    },
                })
            )!;

            await checkSystemMessages(interaction, userData);
            generalConstraints(interaction, command);
            cooldownConstraint(interaction, command);
            await command.execute(interaction, {
                userData,
                userAPIData,
            });
        }
    } catch (error) {
        const userData = (
            await SQLite.getUser<UserData>({
                discordID: interaction.user.id,
                table: Constants.tables.users,
                columns: ['language'],
                allowUndefined: true,
            },
        ).catch(() => ({}))) as UserData;

        const handler = new CommandErrorHandler(error, interaction, userData?.language);
        await handler.systemNotify();
        await handler.userNotify();
    }
};

async function checkSystemMessages(
    interaction: CommandInteraction,
    userData: UserData,
) {
    const locale = RegionLocales.locale(userData.language).errors.systemMessages;
    if (userData.systemMessages.length > 0) {
        const systemMessages = new BetterEmbed({ name: locale.embed.footer })
            .setColor(Constants.colors.normal)
            .setTitle(locale.embed.title)
            .setDescription(locale.embed.description);

        for (const message of userData.systemMessages) {
            systemMessages.addField(message.name, message.value);
        }

        try { //Add a way to send a file instead if there are more than 25 fields/oer 6k chars?
            await interaction.user.send({ embeds: [systemMessages] });
        } catch (error) {
            if (
                (error as DiscordAPIError).code ===
                    DiscordConstants.APIErrors.CANNOT_MESSAGE_USER
            ) {
                systemMessages.description += locale.failedDM;

                Log.command(interaction, 'Code 50007 while sending system message(s)');

                await interaction.channel!.send({
                    content: interaction.user.toString(),
                    embeds: [systemMessages],
                });
            }
        }

        await SQLite.updateUser<UserData>({
            discordID: userData.discordID,
            table: Constants.tables.users,
            data: { systemMessages: [] },
        });
    }
}

function generalConstraints(
    interaction: CommandInteraction,
    command: ClientCommand,
) {
    const { blockedUsers, devMode } = interaction.client.config;

    if (blockedUsers.includes(interaction.user.id)) {
        throw new ConstraintError('blockedUsers');
    }

    if (
        devMode === true &&
        ownerID.includes(interaction.user.id) === false
    ) {
        throw new ConstraintError('devMode');
    }

    if (
        command.properties.ownerOnly === true &&
        ownerID.includes(interaction.user.id) === false
    ) {
        throw new ConstraintError('owner');
    }

    if (
        command.properties.noDM === true &&
        !interaction.inGuild()
    ) {
        throw new ConstraintError('dm');
    }
}

function cooldownConstraint(
    interaction: CommandInteraction,
    command: ClientCommand,
) {
    const { client: { cooldowns }, user } = interaction;
    const { name, cooldown } = command.properties;

    const timestamps = cooldowns.get(name);

    if (!timestamps) {
        cooldowns.set(name, new Collection());
        cooldowns.get(name)!.set(user.id, Date.now());
        return;
    }

    const expireTime = Number(timestamps.get(user.id)) + cooldown;
    const isCooldown = expireTime > (Constants.ms.second * 2.5) + Date.now();
    const timeLeft = expireTime - Date.now();

    if (isCooldown) {
        throw new ConstraintError('cooldown', timeLeft);
    }

    timestamps.set(user.id, Date.now());
}