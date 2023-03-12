import { Events, type InteractionHandlerError, Listener } from '@sapphire/framework';
import { InteractionErrorHandler } from '../../errors/InteractionErrorHandler';

export class InteractionHandlerErrorListener extends Listener {
    public constructor(context: Listener.Context) {
        super(context, { event: Events.InteractionHandlerError });
    }

    public run(error: unknown, context: InteractionHandlerError) {
        const { name, location } = context.handler;
        new InteractionErrorHandler(error, context.interaction, name, location.full).init();
    }
}
