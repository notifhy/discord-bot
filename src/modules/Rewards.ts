import type { users as User } from '@prisma/client';
import {
    ButtonInteraction,
    Constants,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
} from 'discord.js';
import { Time } from '../enums/Time';
import { ModuleErrorHandler } from '../errors/ModuleErrorHandler';
import { i18n as Internationalization } from '../locales/i18n';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Module } from '../structures/Module';
import { Options } from '../utility/Options';
import { disableComponents } from '../utility/utility';

export class RewardsModule extends Module {
    public constructor(context: Module.Context, options: Module.Options) {
        super(context, {
            ...options,
            name: 'rewards',
            localization: 'modulesRewardsName',
            cronIncludeAPIData: false,
        });
    }

    public override async cron(user: User) {
        /**
         * Rewards module will:
         * - Will operate on an interval (30 minutes) and check for reminders to send out
         * - WIll operate on interactions
         *  - Actually validate if they actually claimed it OR
         *  - Simply update database or whatever
         */

        const i18n = new Internationalization(user.locale);

        const now = Date.now();

        const hypixelTime = new Date(
            new Date(now).toLocaleString('en-US', {
                timeZone: Options.modulesRewardsHypixelTimezone,
            }),
        ).getTime();

        const hypixelToClientOffset = hypixelTime - now;

        const lastResetTime = new Date(hypixelTime).setHours(0, 0, 0, 0) - hypixelToClientOffset;

        const bounds = Time.Minute * 15;

        const isAtResetTime = now + bounds > lastResetTime && now - bounds < lastResetTime;

        this.container.logger.debug(
            `User ${user.id}`,
            `${this.constructor.name}:`,
            `Reset Time: ${lastResetTime}`,
            `Now: ${now} ${new Date(now).toLocaleString()}`,
            now + bounds,
            now - bounds,
        );

        if (isAtResetTime || true) {
            const discordUser = await this.container.client.users.fetch(user.id);
            const descriptionArray = i18n.getList('modulesRewardsReminderDescription');
            const random = Math.floor(Math.random() * descriptionArray.length);
            const description = descriptionArray[random]!;

            const rewardNotification = new BetterEmbed({
                text: i18n.getMessage('modulesRewardsFooter'),
            })
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('modulesRewardsReminderTitle'))
                .setDescription(description);

            const message = await discordUser.send({
                embeds: [rewardNotification],
                components: [
                    new MessageActionRow().setComponents(
                        new MessageButton()
                            .setCustomId('a')
                            .setLabel('why')
                            .setStyle(Constants.MessageButtonStyles.PRIMARY),
                    ),
                ],
            });

            await this.container.database.rewards.update({
                data: {
                    lastNotified: Date.now(),
                },
                where: {
                    id: user.id,
                },
            });

            this.container.logger.info(
                `User ${user.id}`,
                `${this.constructor.name}:`,
                'Delivered reminder.',
            );

            await this.container.client.channels.fetch(message.channelId);

            // eslint-disable-next-line arrow-body-style
            const componentFilter = (i: MessageComponentInteraction) => {
                return user.id === i.user.id && i.message.id === message.id;
            };

            const collector = message.createMessageComponentCollector({
                componentType: Constants.MessageComponentTypes.BUTTON,
                filter: componentFilter,
                max: 1,
                time: lastResetTime + Time.Day - Date.now(),
            });

            const disabledRows = disableComponents(message.components);

            collector.on('collect', async (_interaction: ButtonInteraction) => {
                try {
                    // handle interactions here
                } catch (error) {
                    await new ModuleErrorHandler(error, this, user).init();
                }
            });

            collector.on('end', async () => {
                try {
                    await message.edit({
                        components: disabledRows,
                    })
                } catch (error) {
                    await new ModuleErrorHandler(error, this, user).init();
                }
            });
        }
    }
}
