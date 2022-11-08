import { Events, Listener, type ListenerErrorPayload } from '@sapphire/framework';
import { ErrorHandler } from '../../errors/ErrorHandler';

export class CoreEvent extends Listener<typeof Events.ListenerError> {
    public constructor(context: Listener.Context) {
        super(context, { event: Events.ListenerError });
    }

    public run(error: unknown, context: ListenerErrorPayload) {
        const { name, event, location } = context.piece;
        new ErrorHandler(error, name, String(event), location.full).init();
    }
}
