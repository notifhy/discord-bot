import { Precondition } from '@sapphire/framework';
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import { i18n } from '../locales/i18n';
import { Logger } from '../structures/Logger';

export class BasePrecondition extends Precondition {
    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        return this.command(interaction);
    }

    public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
        return this.command(interaction);
    }

    private async command(
        interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
    ) {
        Object.defineProperty(interaction, 'i18n', {
            value: new i18n(interaction.locale),
        });

        await interaction.deferReply({
            ephemeral: true,
        });

        const user = await this.container.database.users.findUnique({
            select: {
                locale: true,
            },
            where: {
                id: interaction.user.id,
            },
        });

        if (user && user.locale !== interaction.locale) {
            await this.container.database.users.update({
                data: {
                    locale: interaction.locale,
                },
                where: {
                    id: interaction.user.id,
                },
            });

            this.container.logger.info(
                this,
                Logger.interactionLogContext(interaction),
                `Updated user locale to ${interaction.locale}.`,
            );
        }

        return this.ok();
    }
}

declare module '@sapphire/framework' {
    interface Preconditions {
        Base: never;
    }
}

declare module 'discord.js' {
    interface BaseInteraction {
        i18n: i18n;
    }
}
