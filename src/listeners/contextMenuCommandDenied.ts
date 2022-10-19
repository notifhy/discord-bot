import {
    type ContextMenuCommandDeniedPayload,
    Events,
    Listener,
    type UserError,
} from '@sapphire/framework';
import { InteractionPreconditionErrorHandler } from '../errors/InteractionPreconditionErrorHandler';

export class ContextMenuCommandDeniedListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.ContextMenuCommandDenied,
        });
    }

    public async run(error: UserError, payload: ContextMenuCommandDeniedPayload) {
        await new InteractionPreconditionErrorHandler(
            error,
            payload.interaction,
            payload.command,
        ).init();
    }
}
