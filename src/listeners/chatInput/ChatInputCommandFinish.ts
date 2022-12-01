import { EmbedLimits } from '@sapphire/discord-utilities';
import { type ChatInputCommandFinishPayload, Events, Listener } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
import { ErrorHandler } from '../../errors/ErrorHandler';
import { BetterEmbed } from '../../structures/BetterEmbed';
import { Logger } from '../../structures/Logger';
import { Options } from '../../utility/Options';
import { cleanRound, timestamp } from '../../utility/utility';

export class ChatInputCommandFinishListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.ChatInputCommandFinish,
        });
    }

    public async run(_: never, __: never, payload: ChatInputCommandFinishPayload) {
        this.container.logger[payload.success ? 'debug' : 'error'](
            this,
            Logger.interactionLogContext(payload.interaction),
            `Took ${cleanRound(payload.duration, 0)}ms.`,
            `Success ${payload.success}.`,
        );

        try {
            await this.dispatchSystemMessages(payload.interaction);
        } catch (error) {
            new ErrorHandler(error).init();
        }
    }

    private async dispatchSystemMessages(interaction: CommandInteraction) {
        const systemMessages = await this.container.database.system_messages.findMany({
            take: EmbedLimits.MaximumFields,
            where: {
                id: interaction.user.id,
                AND: {
                    read: false,
                },
            },
        });

        if (systemMessages.length > 0) {
            const { i18n } = interaction;

            const systemMessagesEmbed = new BetterEmbed({
                text: i18n.getMessage('systemMessagesFooter'),
            })
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('systemMessagesTitle'))
                .setDescription(i18n.getMessage('systemMessagesDescription'))
                .setFields(
                    ...systemMessages.map((systemMessage) => {
                        const time = timestamp(systemMessage.timestamp, 'D');

                        return {
                            name: `${systemMessage.name} - ${time}`,
                            value: systemMessage.value,
                        };
                    }),
                );

            let sentDM = false;

            if (interaction.guildId) {
                try {
                    await interaction.user.send({ embeds: [systemMessagesEmbed] });
                    sentDM = true;
                } catch (error) {
                    this.container.logger.error(
                        this,
                        Logger.interactionLogContext(interaction),
                        'Error while sending user system notifications.',
                    );

                    new ErrorHandler(error).init();
                }
            }

            await interaction.followUp({
                content: interaction.user.toString(),
                embeds: [systemMessagesEmbed],
                ephemeral: sentDM,
            });

            await this.container.database.system_messages.updateMany({
                data: {
                    read: true,
                },
                where: {
                    index: {
                        in: systemMessages.map((systemMessage) => systemMessage.index),
                    },
                },
            });

            this.container.logger.info(
                this,
                Logger.interactionLogContext(interaction),
                `Sent ${systemMessages.length} system message(s).`,
            );
        }
    }
}
