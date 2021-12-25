import type { EventProperties, ClientCommand } from '../@types/client';
import type { RawUserData, UserAPIData, UserData } from '../@types/database';
import { BetterEmbed, formattedUnix, slashCommandResolver } from '../util/utility';
import { Collection, CommandInteraction, DiscordAPIError } from 'discord.js';
import { ownerID } from '../../config.json';
import { SQLiteWrapper } from '../database';
import Constants from '../util/Constants';
import ConstraintError from '../util/errors/ConstraintError';
import { CommandErrorHandler } from '../util/errors/handlers/CommandErrorHandler';

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

            console.log(
                `${formattedUnix({
                    date: true,
                    utc: true,
                })} | Slash Command from ${interaction.user.tag} (${
                    interaction.user.id
                }) | ${slashCommandResolver(interaction)}`,
            );

            await interaction.deferReply({
                ephemeral: command.properties.ephemeral,
            });

            const userAPIData = (await SQLiteWrapper.getUser({
                discordID: interaction.user.id,
                table: Constants.tables.api,
                columns: ['*'],
                allowUndefined: true,
            })) as UserAPIData | undefined;

            let userData = (await SQLiteWrapper.getUser<RawUserData, UserData>({
                discordID: interaction.user.id,
                table: Constants.tables.users,
                columns: ['*'],
                allowUndefined: true,
            })) as UserData | undefined;

            userData ??= (await SQLiteWrapper.newUser<
                UserData,
                RawUserData,
                UserData
            >({
                table: Constants.tables.users,
                returnNew: true,
                data: {
                    discordID: interaction.user.id,
                    ...Constants.defaults.users,
                },
            })) as UserData;

            await checkSystemMessages(interaction, userData);
            cooldownConstraint(interaction, command);
            generalConstraints(interaction, command);
            await command.execute(interaction, {
                userData,
                userAPIData,
            });
        }
    } catch (error) {
        const { language } = (await SQLiteWrapper.getUser<RawUserData, UserData>({
            discordID: interaction.user.id,
            table: Constants.tables.users,
            columns: ['language'],
            allowUndefined: true,
        }).catch(() => ({}))) as UserData;

        const handler = new CommandErrorHandler(error, interaction, language);
        await handler.systemNotify();
        await handler.userNotify();
    }
};

async function checkSystemMessages(
    interaction: CommandInteraction,
    userData: UserData,
) {
    if (userData.systemMessage !== null) {
        const test = new BetterEmbed({ name: 'System Message' }) //Localize
            .setColor(Constants.colors.normal)
            .setTitle('System Message')
            .setDescription('This is a notification regarding an aspect of this bot.')
            .setField('Message', userData.systemMessage);

        try {
            await interaction.user.send({ embeds: [test] });
        } catch (error) {
            if ((error as DiscordAPIError).code === 50007) {
                await interaction.channel!.send({ embeds: [test] });
            }
        }

        await SQLiteWrapper.updateUser<Partial<UserData>, Partial<RawUserData>>({
            discordID: userData.discordID,
            table: Constants.tables.users,
            data: { systemMessage: null },
        });
    }
}

function cooldownConstraint(
    interaction: CommandInteraction,
    command: ClientCommand,
) {
    const { client: { cooldowns }, user } = interaction;
    const { properties: { name, cooldown } } = command;

    const timestamps = cooldowns.get(name);

    if (!timestamps) {
        cooldowns.set(name, new Collection());
        cooldowns.get(name)!.set(user.id, Date.now());
        return;
    }

    const expireTime = Number(timestamps.get(user.id)) + cooldown;
    const isCooldown = expireTime > Date.now() + 2_500;
    const timeLeft = expireTime - Date.now();

    if (isCooldown) {
        throw new ConstraintError('cooldown', timeLeft);
    }

    timestamps.set(user.id, Date.now());
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