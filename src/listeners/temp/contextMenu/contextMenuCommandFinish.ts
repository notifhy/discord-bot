import {
    type ContextMenuCommandFinishPayload,
    Events,
    Listener,
} from '@sapphire/framework';
import { cleanRound, interactionLogContext } from '../../../utility/utility';

export class ContextMenuCommandFinishListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.ContextMenuCommandFinish,
        });
    }

    public async run(_: never, __: never, payload: ContextMenuCommandFinishPayload) {
        this.container.logger[payload.success ? 'debug' : 'error'](
            interactionLogContext(payload.interaction),
            `${this.constructor.name}:`,
            `Took ${cleanRound(payload.duration, 0)}ms.`,
            `Success ${payload.success}.`,
        );
    }
}
