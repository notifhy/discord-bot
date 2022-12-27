import type { users as User } from '@prisma/client';
import { Piece } from '@sapphire/framework';
import type { MessageComponentInteraction } from 'discord.js';
import type { MessageKeys } from '../locales/locales';

export class Module<O extends Module.Options = Module.Options> extends Piece<O> {
    public override name: 'friends' | 'playtime' | 'rewards';

    public readonly localization: keyof MessageKeys;

    public readonly requireOnlineStatusAPI: boolean;

    public constructor(context: Module.Context, options: O) {
        super(context, options);

        this.name = options.name;
        this.localization = options.localization;
        this.requireOnlineStatusAPI = options.requireOnlineStatusAPI ?? false;
    }

    public cron?(user: User): Promise<void>;

    public event?(user: User): Promise<void>;

    public interaction?(user: User, interaction: MessageComponentInteraction): Promise<void>;
}

export interface ModuleOptions extends Piece.Options {
    readonly name: 'friends' | 'playtime' | 'rewards';
    readonly localization: keyof MessageKeys;
    readonly requireOnlineStatusAPI?: boolean;
}

export namespace Module {
    export type Options = ModuleOptions;
    export type Context = Piece.Context;
}
