import {
    type ChatInputCommandDeniedPayload,
    Events,
    Listener,
    type UserError,
} from '@sapphire/framework';
import { InteractionPreconditionErrorHandler } from '../../errors/InteractionPreconditionErrorHandler';

export class ChatInputCommandDeniedErrorListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.ChatInputCommandDenied,
        });
    }

    public async run(error: UserError, payload: ChatInputCommandDeniedPayload) {
        await new InteractionPreconditionErrorHandler(
            error,
            payload.interaction,
            payload.command,
        ).init();
    }
}
