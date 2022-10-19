import type { Interaction } from 'discord.js';
import { BaseErrorHandler } from './BaseErrorHandler';

export class BaseInteractionErrorHandler<E, I extends Interaction> extends BaseErrorHandler<E> {
    public readonly interaction: I;

    public constructor(error: E, interaction: I) {
        super(error);
        this.interaction = interaction;
        this.i18n.setLocale(this.interaction.locale);

        this.sentry.baseInteractionContext(this.interaction);
    }
}
