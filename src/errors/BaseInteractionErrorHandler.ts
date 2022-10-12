import { type Interaction } from 'discord.js';
import { BaseErrorHandler } from './BaseErrorHandler';
import { i18n } from '../locales/i18n';

export class BaseInteractionErrorHandler<E> extends BaseErrorHandler<E> {
    public readonly interaction: Interaction;

    public readonly i18n: i18n;

    public constructor(
        error: E,
        interaction: Interaction,
    ) {
        super(error);
        this.interaction = interaction;
        this.i18n = new i18n(this.interaction.locale);

        this.sentry.baseInteractionContext(this.interaction);
    }
}