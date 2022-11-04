import {
    type ChatInputCommandFinishPayload,
    Events,
    Listener,
} from '@sapphire/framework';
import { cleanRound, interactionLogContext } from '../../utility/utility';

export class ChatInputCommandFinishListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.ChatInputCommandFinish,
        });
    }

    public async run(_: never, __: never, payload: ChatInputCommandFinishPayload) {
        this.container.logger[payload.success ? 'info' : 'error'](
            interactionLogContext(payload.interaction),
            `${this.constructor.name}:`,
            `Took ${cleanRound(payload.duration, 0)}ms.`,
            `Success ${payload.success}.`,
        );
    }
}
