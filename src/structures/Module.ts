import type { users as User } from '@prisma/client';
import { Piece } from '@sapphire/framework';
import type { CleanHypixelData } from '../@types/Hypixel';
import type { Changes } from '../core/Data';
import type { MessageKeys } from '../locales/locales';

export abstract class Module<O extends Module.Options = Module.Options> extends Piece<O> {
    public override name: 'defender' | 'friends' | 'rewards';

    public readonly localization: keyof MessageKeys;

    public readonly requireOnlineStatusAPI: boolean;

    public constructor(context: Module.Context, options: O = {} as O) {
        super(context, options);

        this.name = options.name;
        this.localization = options.localization;
        this.requireOnlineStatusAPI = options.requireOnlineStatusAPI ?? false;
    }

    public abstract run(user: User, newData: CleanHypixelData, changes: Changes): Promise<void>;
}

export interface ModuleOptions extends Piece.Options {
    readonly name: 'defender' | 'friends' | 'rewards';
    readonly localization: keyof MessageKeys;
    readonly requireOnlineStatusAPI: boolean;
}

export namespace Module {
    export type Options = ModuleOptions;
    export type Context = Piece.Context;
}
