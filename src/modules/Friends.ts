import type { users as User } from '@prisma/client';
import { PermissionsBitField, TextChannel, userMention } from 'discord.js';
import type { FriendsEventPayload } from '../@types/EventPayload';
import { i18n as Internationalization } from '../locales/i18n';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Logger } from '../structures/Logger';
import { Module } from '../structures/Module';
import { Modules } from '../structures/Modules';
import { Options } from '../utility/Options';
import { timestamp } from '../utility/utility';
import { Event } from '../enums/Event';
import { Time } from '../enums/Time';
import { setTimeout } from 'timers/promises';

export class FriendsModule extends Module {
    public constructor(context: Module.Context, options: Module.Options) {
        super(context, {
            ...options,
            name: 'friends',
            allowedEvents: [Event.Connected, Event.Disconnected],
            localizationFooter: 'modulesFriendsFooter',
            localizationName: 'modulesFriendsName',
            requireOnlineStatusAPI: false,
        });
    }

    public override async event(user: User, payload: FriendsEventPayload) {
        // fix race condition with hypixel api :)
        setTimeout(Time.Second * 10);

        const config = await this.container.database.friends.findUniqueOrThrow({
            where: {
                id: user.id,
            },
        });

        const channel = (await this.container.client.channels.fetch(
            config.channel!,
        )) as TextChannel;

        const me = await channel.guild.members.fetch(this.container.client.user!.id);

        const missingPermissions = channel
            .permissionsFor(me)
            .missing([
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ViewChannel,
            ]);

        const i18n = new Internationalization(user.locale);

        if (missingPermissions.length !== 0) {
            this.container.logger.warn(
                this,
                Logger.moduleContext(user),
                `Missing permissions: ${missingPermissions.join(', ')}`,
            );

            await this.container.database.$transaction([
                this.container.database.modules.update({
                    data: {
                        friends: {
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
                        name_key: 'modulesFriendsMissingPermissionName',
                        value_key: 'modulesFriendsMissingPermissionValue',
                        value_variables: [missingPermissions.join(', ')],
                    },
                }),
            ]);

            const missingPermissionEmbed = new BetterEmbed()
                .setColor(Options.colorsWarning)
                .setTitle(i18n.getMessage('modulesFriendsMissingPermissionName'))
                .setDescription(
                    i18n.getMessage('modulesFriendsMissingPermissionValue', [
                        missingPermissions.join(', '),
                    ]),
                )
                .setFooter({
                    text: i18n.getMessage(this.localizationFooter),
                });

            const discordUser = await this.container.client.users.fetch(user.id);

            await discordUser.send({
                embeds: [missingPermissionEmbed],
            });

            return;
        }

        const data = await Modules.fetch(user);
        let lastLogin = data.data.lastLogin ?? Date.now();
        let lastLogout = data.data.lastLogout ?? Date.now();

        // hypixel api may have old data, use current time if so
        if ((Date.now() - Time.Minute) > lastLogin) {
            lastLogin = Date.now();
        }

        if ((Date.now() - Time.Minute) > lastLogout) {
            lastLogout = Date.now();
        }

        const embed = new BetterEmbed().setFooter({
            text: i18n.getMessage(this.localizationFooter),
        });

        if (payload.event.type === Event.Connected) {
            embed
                .setColor(Options.colorsOn)
                .setDescription(
                    i18n.getMessage('modulesFriendsLoggedIn', [
                        userMention(user.id),
                        timestamp(lastLogin!, 'R')!,
                        timestamp(lastLogin!, 'T')!,
                    ]),
                );
        } else {
            embed
                .setColor(Options.colorsOff)
                .setDescription(
                    i18n.getMessage('modulesFriendsLoggedOut', [
                        userMention(user.id),
                        timestamp(lastLogout!, 'R')!,
                        timestamp(lastLogout!, 'T')!,
                    ]),
                );
        }

        await channel.send({
            allowedMentions: {
                parse: [],
            },
            embeds: [embed],
        });
    }
}
