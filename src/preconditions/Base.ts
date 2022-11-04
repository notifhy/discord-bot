import { Precondition } from '@sapphire/framework';
import type { CommandInteraction, ContextMenuInteraction } from 'discord.js';
import { i18n } from '../locales/i18n';

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

    /*
    interface Message {
        i18n: i18n;
    }
    */
}
