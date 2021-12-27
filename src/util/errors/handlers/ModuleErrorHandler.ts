import { BetterEmbed, sendWebHook } from '../../utility';
import { ColorResolvable, CommandInteraction } from 'discord.js';
import {
    fatalWebhook,
    nonFatalWebhook,
    ownerID,
} from '../../../../config.json';
import BaseErrorHandler from './BaseErrorHandler';
import ConstraintError from '../ConstraintError';

export class ModuleErrorHandler extends BaseErrorHandler {
    interaction: CommandInteraction;
    locale: string;

    constructor(
        error: unknown,
        interaction: CommandInteraction,
        locale: string,
    ) {
        super(error);
        this.interaction = interaction;
        this.locale = locale;
        this.errorLog();
    }

    private errorLog() {
        if (this.error instanceof ConstraintError) {
            this.log(`${this.interaction.user.tag} failed the constraint ${this.error.message}`);
        } else {
            this.log(this.error);
        }
    }
}

/**
 * filter by discord api code, module error class prob not necessary
 */