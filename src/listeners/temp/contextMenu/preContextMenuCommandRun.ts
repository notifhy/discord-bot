import {
    Events,
    Listener,
    type PreContextMenuCommandRunPayload,
} from '@sapphire/framework';
import { contextMenuResolver, interactionLogContext } from '../../../utility/utility';

export class PreContextMenuCommandRunListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.PreContextMenuCommandRun,
        });
    }

    public async run(payload: PreContextMenuCommandRunPayload) {
        this.container.logger.info(
            interactionLogContext(payload.interaction),
            `${this.constructor.name}:`,
            contextMenuResolver(payload.interaction),
        );
    }
}
