import type { users as User } from '@prisma/client';
import { Formatters, MessageEmbed, Permissions, TextChannel } from 'discord.js';
import type { FriendsEventPayload } from '../@types/EventPayload';
import { i18n as Internationalization } from '../locales/i18n';
import { Module } from '../structures/Module';
import { Modules } from '../structures/Modules';
import { Options } from '../utility/Options';
import { timestamp } from '../utility/utility';

export class FriendsModule extends Module {
    public constructor(context: Module.Context, options: Module.Options) {
        super(context, {
            ...options,
            name: 'friends',
            localization: 'modulesFriendsName',
            requireOnlineStatusAPI: false,
        });
    }

    /**
     * Friends module will:
     * - Will operate on the upcoming mod
     */

    public override async event(user: User, payload: FriendsEventPayload) {
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
                Permissions.FLAGS.EMBED_LINKS,
                Permissions.FLAGS.SEND_MESSAGES,
                Permissions.FLAGS.VIEW_CHANNEL,
            ]);

        const i18n = new Internationalization(user.locale);

        if (missingPermissions.length !== 0) {
            await this.container.database.system_messages.create({
                data: {
                    id: user.id,
                    timestamp: Date.now(),
                    name: i18n.getMessage('modulesFriendsMissingPermissionName'),
                    value: i18n.getMessage('modulesFriendsMissingPermissionDescription'),
                },
            });

            return;
        }

        const data = await Modules.fetch(user);
        const lastLogin = data.data.lastLogin ?? Date.now();
        const lastLogout = data.data.lastLogout ?? Date.now();

        const embed = new MessageEmbed();

        if (payload.joined === true) {
            embed
                .setColor(Options.colorsOn)
                .setDescription(
                    i18n.getMessage('modulesFriendsLoggedIn', [
                        Formatters.userMention(user.id),
                        timestamp(lastLogin!, 'R')!,
                        timestamp(lastLogin!, 'T')!,
                    ]),
                );
        } else {
            embed
                .setColor(Options.colorsOff)
                .setDescription(
                    i18n.getMessage('modulesFriendsLoggedOut', [
                        Formatters.userMention(user.id),
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
