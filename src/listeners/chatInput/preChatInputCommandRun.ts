import {
    Events,
    Listener,
    type PreChatInputCommandRunPayload,
} from '@sapphire/framework';
import { chatInputResolver, interactionLogContext } from '../../utility/utility';

export class PreChatInputCommandRunListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.PreChatInputCommandRun,
        });
    }

    public async run(payload: PreChatInputCommandRunPayload) {
        this.container.logger.info(
            interactionLogContext(payload.interaction),
            `${this.constructor.name}:`,
            chatInputResolver(payload.interaction),
        );
    }
}
