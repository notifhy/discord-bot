import type { users as User } from '@prisma/client';
import { EmbedBuilder, PermissionsBitField, TextChannel } from 'discord.js';
import { Module } from '../structures/Module';
import { i18n as Internationalization } from '../locales/i18n';
import { Modules } from '../structures/Modules';
import { Options } from '../utility/Options';
import { cleanLength, timestamp } from '../utility/utility';
import { Logger } from '../structures/Logger';
import { BetterEmbed } from '../structures/BetterEmbed';

export class PlaytimeModule extends Module {
    public constructor(context: Module.Context, options: Module.Options) {
        super(context, {
            ...options,
            name: 'playtime',
            localizationFooter: 'modulesPlaytimeFooter',
            localizationName: 'modulesPlaytimeName',
            requireOnlineStatusAPI: true,
        });
    }

    /**
     * Friends module will:
     * - Will operate on the upcoming mod
     */

    public override async event(user: User) {
        const config = await this.container.database.playtime.findUniqueOrThrow({
            where: {
                id: user.id,
            },
        });

        const sendable = config.channel
            ? (await this.container.client.channels.fetch(config.channel!)) as TextChannel
            : await this.container.client.users.fetch(user.id);

        if (sendable instanceof TextChannel) {
            const me = await sendable.guild.members.fetch(this.container.client.user!.id);

            const missingPermissions = sendable
                .permissionsFor(me)
                .missing([
                    PermissionsBitField.Flags.EmbedLinks,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ViewChannel,
                ]);

            if (missingPermissions.length !== 0) {
                this.container.logger.info(
                    this,
                    Logger.moduleContext(user),
                    `Missing permissions: ${missingPermissions.join(', ')}`,
                );

                await this.container.database.$transaction([
                    this.container.database.modules.update({
                        data: {
                            playtime: {
                                set: false,
                            },
                        },
                        where: {
                            id: user.id,
                        },
                    }),
                    this.container.database.system_messages.create({
                        data: {
                            id: user.id,
                            timestamp: Date.now(),
                            name_key: 'modulesPlaytimeMissingPermissionName',
                            value_key: 'modulesPlaytimeMissingPermissionValue',
                            value_variables: [
                                missingPermissions.join(', '),
                            ],
                        },
                    }),
                ]);

                const i18n = new Internationalization(user.locale);

                const missingPermissionEmbed = new BetterEmbed()
                    .setColor(Options.colorsWarning)
                    .setTitle(i18n.getMessage('modulesPlaytimeMissingPermissionName'))
                    .setDescription(i18n.getMessage('modulesPlaytimeMissingPermissionValue', [
                        missingPermissions.join(', '),
                    ]))
                    .setFooter({
                        text: i18n.getMessage(this.localizationFooter),
                    });

                const discordUser = await this.container.client.users.fetch(user.id);

                await discordUser.send({
                    embeds: [missingPermissionEmbed],
                });

                return;
            }
        }

        const data = await Modules.fetch(user);

        if (data.data.lastLogin! > data.data.lastLogout!) {
            const i18n = new Internationalization(user.locale);

            const embed = new EmbedBuilder()
                .setColor(Options.colorsOff)
                .setDescription(
                    i18n.getMessage('modulesPlaytimePlaytimeDescription', [
                        timestamp(data.data.lastLogout!, 'T')!,
                        cleanLength(data.data.lastLogout! - data.data.lastLogin!)!,
                    ]),
                )
                .setFooter({
                    text: i18n.getMessage(this.localizationFooter),
                });

            await sendable.send({ embeds: [embed] });
        }
    }
}
