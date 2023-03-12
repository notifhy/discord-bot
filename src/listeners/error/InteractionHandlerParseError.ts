import {
    Events,
    type InteractionHandlerParseError as InteractionHandlerParseErrorPayload,
    Listener,
} from '@sapphire/framework';
import { InteractionErrorHandler } from '../../errors/InteractionErrorHandler';

export class InteractionHandlerParseErrorListener extends Listener {
    public constructor(context: Listener.Context) {
        super(context, { event: Events.InteractionHandlerParseError });
    }

    public run(error: unknown, context: InteractionHandlerParseErrorPayload) {
        const { name, location } = context.handler;
        new InteractionErrorHandler(error, context.interaction, name, location.full).init();
    }
}
