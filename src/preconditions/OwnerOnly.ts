import { Precondition } from '@sapphire/framework';
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import { Identifier } from '../enums/Identifier';

export class DevModePrecondition extends Precondition {
    public override chatInputRun(interaction: ChatInputCommandInteraction) {
        return this.checkOwner(interaction.user.id);
    }

    public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
        return this.checkOwner(interaction.user.id);
    }

    private checkOwner(userId: string) {
        return this.container.config.owners.includes(userId)
            ? this.ok()
            : this.error({
                identifier: Identifier.OwnerOnly,
            });
    }
}

declare module '@sapphire/framework' {
    interface Preconditions {
        OwnerOnly: never;
    }
}
