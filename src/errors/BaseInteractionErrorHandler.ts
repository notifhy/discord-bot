import { type CommandInteraction } from 'discord.js';
import { BaseErrorHandler } from './BaseErrorHandler';

export class BaseInteractionErrorHandler<E> extends BaseErrorHandler<E> {
    public readonly interaction: CommandInteraction;

    public constructor(
        error: E,
        interaction: CommandInteraction,
    ) {
        super(error);
        this.interaction = interaction;

        this.sentry.baseInteractionContext(this.interaction);
    }
}