import type { users as User } from '@prisma/client';
import { Base } from './Base';
import { BetterEmbed } from './BetterEmbed';
import { Changes, Hypixel } from './Hypixel';
import { i18n as Internationalization } from '../locales/i18n';
import { Logger } from './Logger';
import { Options } from '../utility/Options';

/* eslint-disable no-await-in-loop */

export class Modules extends Base {
    public static async fetch(user: User) {
        const data = await Hypixel.fetch(user);
        Modules.handleDataChanges(data.changes, user);
        return data;
    }

    private static async handleDataChanges(changes: Changes, user: User) {
        const embeds: BetterEmbed[] = [];

        const userModules = await this.container.database.modules.findUniqueOrThrow({
            where: {
                id: user.id,
            },
        });

        const enabledModules = this.container.stores
            .get('modules')
            .filter((module) => userModules[module.name]);

        const requiresOnlineAPI = enabledModules.find((module) => module.requireOnlineStatusAPI);

        if (requiresOnlineAPI) {
            if (Hypixel.isOnlineAPIMissing(changes)) {
                const i18n = new Internationalization(user.locale);

                embeds.push(
                    new BetterEmbed()
                        .setColor(Options.colorsNormal)
                        .setTitle(i18n.getMessage('modulesHypixelDataMissingOnlineStatusAPITitle'))
                        .setDescription(
                            i18n.getMessage('modulesHypixelDataMissingOnlineStatusAPIDescription'),
                        )
                        .setFooter({ text: i18n.getMessage('modulesHypixelDataFooter') }),
                );

                this.container.logger.info(
                    this,
                    Logger.moduleContext(user),
                    'Missing Online Status API data.',
                );
            } else if (Hypixel.isOnlineAPIReceived(changes)) {
                const i18n = new Internationalization(user.locale);

                embeds.push(
                    new BetterEmbed()
                        .setColor(Options.colorsNormal)
                        .setTitle(i18n.getMessage('modulesHypixelDataReceivedOnlineStatusAPITitle'))
                        .setDescription(
                            i18n.getMessage('modulesHypixelDataReceivedOnlineStatusAPIDescription'),
                        )
                        .setFooter({ text: i18n.getMessage('modulesHypixelDataFooter') }),
                );

                this.container.logger.info(
                    this,
                    Logger.moduleContext(user),
                    'Received Online Status API data.',
                );
            }
        }

        if (embeds.length > 0) {
            const discordUser = await this.container.client.users.fetch(user.id);

            await discordUser.send({
                embeds: embeds,
            });
        }
    }
}
