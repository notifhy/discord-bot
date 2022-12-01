import {
    type ContextMenuCommandFinishPayload,
    Events,
    Listener,
} from '@sapphire/framework';
import { Logger } from '../../structures/Logger';
import { cleanRound } from '../../utility/utility';

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
            this,
            Logger.interactionLogContext(payload.interaction),
            `Took ${cleanRound(payload.duration, 0)}ms.`,
            `Success ${payload.success}.`,
        );
    }
}
