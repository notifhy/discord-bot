import {
    type ContextMenuCommandErrorPayload,
    Events,
    Listener,
} from '@sapphire/framework';
import { InteractionErrorHandler } from '../errors/InteractionErrorHandler';

export class ContextMenuCommandErrorListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.ContextMenuCommandError,
        });
    }

    public async run(error: Error, payload: ContextMenuCommandErrorPayload) {
        await new InteractionErrorHandler(error, payload.interaction).init();
    }
}