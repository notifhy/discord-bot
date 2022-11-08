import { Events, type InteractionHandlerError, Listener } from '@sapphire/framework';
import { ErrorHandler } from '../../errors/ErrorHandler';

export class CoreEvent extends Listener {
    public constructor(context: Listener.Context) {
        super(context, { event: Events.InteractionHandlerError });
    }

    public run(error: unknown, context: InteractionHandlerError) {
        const { name, location } = context.handler;
        new ErrorHandler(error, name, location.full).init();
    }
}
