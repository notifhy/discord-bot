import {
    Events,
    Listener,
    type PreChatInputCommandRunPayload,
} from '@sapphire/framework';
import { Logger } from '../../structures/Logger';
import { chatInputResolver } from '../../utility/utility';

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
            this,
            Logger.interactionLogContext(payload.interaction),
            chatInputResolver(payload.interaction),
        );
    }
}
