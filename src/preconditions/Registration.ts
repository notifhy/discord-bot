import { Precondition } from '@sapphire/framework';
import type { CommandInteraction, ContextMenuInteraction } from 'discord.js';
import { Identifier } from '../enums/Identifier';

export class RegistrationPrecondition extends Precondition {
    public override chatInputRun(interaction: CommandInteraction) {
        return this.checkRegistration(interaction.user.id);
    }

    public override contextMenuRun(interaction: ContextMenuInteraction) {
        return this.checkRegistration(interaction.user.id);
    }

    private async checkRegistration(userId: string) {
        const user = await this.container.database.users.findUnique({
            where: {
                id: userId,
            },
        });

        return user
            ? this.ok()
            : this.error({
                identifier: Identifier.Registration,
            });
    }
}

declare module '@sapphire/framework' {
    interface Preconditions {
        Registration: never;
    }
}
