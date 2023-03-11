import {
    Events,
    type InteractionHandlerParseError as InteractionHandlerParseErrorPayload,
    Listener,
} from '@sapphire/framework';
import { ErrorHandler } from '../../errors/ErrorHandler';

export class InteractionHandlerParseErrorListener extends Listener {
    public constructor(context: Listener.Context) {
        super(context, { event: Events.InteractionHandlerParseError });
    }

    public run(error: unknown, context: InteractionHandlerParseErrorPayload) {
        const { name, location } = context.handler;
        new ErrorHandler(error, name, location.full).init();
    }
}
