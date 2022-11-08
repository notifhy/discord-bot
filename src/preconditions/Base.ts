import { Precondition } from '@sapphire/framework';
import type { CommandInteraction, ContextMenuInteraction } from 'discord.js';
import { i18n } from '../locales/i18n';
import { interactionLogContext } from '../utility/utility';

export class BasePrecondition extends Precondition {
    public override async chatInputRun(interaction: CommandInteraction) {
        return this.interaction(interaction);
    }

    public override async contextMenuRun(interaction: ContextMenuInteraction) {
        return this.interaction(interaction);
    }

    private async interaction(action: CommandInteraction | ContextMenuInteraction) {
        Object.defineProperty(action, 'i18n', {
            value: new i18n(action.locale),
        });

        await action.deferReply({
            ephemeral: true,
        });

        const user = await this.container.database.users.findUnique({
            select: {
                locale: true,
            },
            where: {
                id: action.user.id,
            },
        });

        if (user && user.locale !== action.locale) {
            await this.container.database.users.update({
                data: {
                    locale: action.locale,
                },
                where: {
                    id: action.user.id,
                },
            });

            this.container.logger.info(
                interactionLogContext(action),
                `${this.constructor.name}:`,
                `Updated user locale to ${action.locale}`,
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
    interface Interaction {
        i18n: i18n;
    }
}
