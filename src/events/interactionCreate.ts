import type {
    ClientCommand,
    ClientEvent,
} from '../@types/client';
import type { UserAPIData, UserData } from '../@types/database';
import {
    BetterEmbed,
    slashCommandResolver,
} from '../util/utility';
import {
    Collection,
    CommandInteraction,
} from 'discord.js';
import { Log } from '../util/Log';
import { ownerID } from '../../config.json';
import { locales, RegionLocales } from '../../locales/RegionLocales';
import { SQLite } from '../util/SQLite';
import CommandErrorHandler from '../util/errors/handlers/CommandErrorHandler';
import Constants from '../util/Constants';
import ConstraintError from '../util/errors/ConstraintError';

export const properties: ClientEvent['properties'] = {
    name: 'interactionCreate',
    once: false,
};

export const execute: ClientEvent['execute'] = async (
    interaction: CommandInteraction,
): Promise<void> => {
    let userData: UserData | void;

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

            userData =
                await SQLite.getUser<UserData>({
                    discordID: interaction.user.id,
                    table: Constants.tables.users,
                    allowUndefined: true,
                    columns: ['*'],
                });

            userData ??=
                await SQLite.newUser<UserData>({
                    table: Constants.tables.users,
                    returnNew: true,
                    data: {
                        discordID: interaction.user.id,
                    },
                });

            await updateLocale(interaction, userData);
            await generalConstraints(interaction, command);
            cooldownConstraint(interaction, command);

            await command.execute(
                interaction,
                userData.locale,
            );

            await checkSystemMessages(
                interaction,
                userData,
                userData.locale,
            );
        }
    } catch (error) {
        const handler = new CommandErrorHandler(
            error,
            interaction,
            userData?.locale ??
            Constants.defaults.language,
        );

        await handler.systemNotify();
        await handler.userNotify();
    }
};

async function updateLocale(
    interaction: CommandInteraction,
    userData: UserData,
) {
    if (
        interaction.locale !== userData.locale &&
        userData.localeOverride === false &&
        Object.keys(locales).includes(interaction.locale)
    ) {
        await SQLite.updateUser<UserData>({
            discordID: interaction.user.id,
            table: Constants.tables.users,
            data: {
                locale: interaction.locale,
            },
        });

        userData.locale = interaction.locale;
    }
}

async function generalConstraints(
    interaction: CommandInteraction,
    command: ClientCommand,
) {
    const { blockedUsers, devMode } = interaction.client.config;
    const { ownerOnly, requireRegistration, noDM } = command.properties;

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
        ownerOnly === true &&
        ownerID.includes(interaction.user.id) === false
    ) {
        throw new ConstraintError('owner');
    }

    if (requireRegistration === true) {
        const data =
            await SQLite.getUser<UserAPIData>({
                discordID: interaction.user.id,
                table: Constants.tables.api,
                allowUndefined: true,
                columns: ['discordID'],
            });

        if (data === undefined) {
            throw new ConstraintError('register');
        }
    }

    if (
        noDM === true &&
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

async function checkSystemMessages(
    interaction: CommandInteraction,
    userData: UserData,
    locale: string,
) {
    if (userData.systemMessages.length > 0) {
        const text = RegionLocales.locale(locale).errors.systemMessages;

        const systemMessages = new BetterEmbed({ text: text.embed.footer })
            .setColor(Constants.colors.normal)
            .setTitle(text.embed.title)
            .setDescription(text.embed.description);

        for (const message of userData.systemMessages) {
            systemMessages.addField(message.name, message.value);
        }

        systemMessages.fields.splice(25);

        const promises = await Promise.allSettled([
            interaction.user.send({ embeds: [systemMessages] }),
            interaction.followUp({
                content: interaction.user.toString(),
                embeds: [systemMessages],
            }),
        ]);

        promises.filter(promise => promise.status === 'rejected')
            .forEach(rejected => {
                Log.command(
                    interaction,
                    'Error while sending system notifications',
                    (rejected as PromiseRejectedResult)?.reason,
                );
            });

        await SQLite.updateUser<UserData>({
            discordID: interaction.user.id,
            table: Constants.tables.users,
            data: { systemMessages: [] },
        });
    }
}