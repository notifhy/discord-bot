import type { users as User } from '@prisma/client';
import { Piece } from '@sapphire/framework';
import type { MessageComponentInteraction } from 'discord.js';
import type { EventPayload } from '../@types/EventPayload';
import type { MessageKeys } from '../locales/locales';
import type { Event } from '../enums/Event';

export class Module<O extends Module.Options = Module.Options> extends Piece<O> {
    public override name: 'friends' | 'playtime' | 'rewards';

    public readonly allowedEvents: Event[];

    public readonly localizationFooter: keyof MessageKeys;

    public readonly localizationName: keyof MessageKeys;

    public readonly requireOnlineStatusAPI: boolean;

    public constructor(context: Module.Context, options: O) {
        super(context, options);

        this.name = options.name;
        this.allowedEvents = options.allowedEvents;
        this.localizationFooter = options.localizationFooter;
        this.localizationName = options.localizationName;
        this.requireOnlineStatusAPI = options.requireOnlineStatusAPI ?? false;
    }

    public cron?(user: User): Promise<void>;

    public event?(user: User, payload: EventPayload): Promise<void>;

    public interaction?(user: User, interaction: MessageComponentInteraction): Promise<void>;
}

export interface ModuleOptions extends Piece.Options {
    readonly name: 'friends' | 'playtime' | 'rewards';
    readonly allowedEvents: Event[];
    readonly localizationFooter: keyof MessageKeys;
    readonly localizationName: keyof MessageKeys;
    readonly requireOnlineStatusAPI?: boolean;
}

export namespace Module {
    export type Options = ModuleOptions;
    export type Context = Piece.Context;
}
