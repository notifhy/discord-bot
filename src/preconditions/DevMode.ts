import { Precondition } from '@sapphire/framework';
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import { Identifier } from '../enums/Identifier';

export class DevModePrecondition extends Precondition {
    public override chatInputRun(interaction: ChatInputCommandInteraction) {
        return this.checkDeveloper(interaction.user.id);
    }

    public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
        return this.checkDeveloper(interaction.user.id);
    }

    private checkDeveloper(userId: string) {
        return this.container.config.devMode === false
            || this.container.config.owners.includes(userId)
            ? this.ok()
            : this.error({
                identifier: Identifier.DevMode,
            });
    }
}

declare module '@sapphire/framework' {
    interface Preconditions {
        DevMode: never;
    }
}
