import { type Command, Events, Listener } from '@sapphire/framework';
import { ErrorHandler } from '../../errors/ErrorHandler';

export class CommandApplicationCommandRegistryErrorListener extends Listener {
    public constructor(context: Listener.Context) {
        super(context, { event: Events.CommandApplicationCommandRegistryError });
    }

    public run(error: unknown, command: Command) {
        const { name, location } = command;
        new ErrorHandler(error, name, location.full).init();
    }
}
