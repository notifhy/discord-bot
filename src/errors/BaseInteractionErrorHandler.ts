import { type Interaction } from 'discord.js';
import { BaseErrorHandler } from './BaseErrorHandler';

export class BaseInteractionErrorHandler<E> extends BaseErrorHandler<E> {
    public readonly interaction: Interaction;

    public constructor(
        error: E,
        interaction: Interaction,
    ) {
        super(error);
        this.interaction = interaction;
        this.i18n.setLocale(this.interaction.locale);

        this.sentry.baseInteractionContext(this.interaction);
    }
}