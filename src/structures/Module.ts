import type { users as User } from '@prisma/client';
import { Piece } from '@sapphire/framework';
import type { MessageKeys } from '../locales/locales';

export class Module<O extends Module.Options = Module.Options> extends Piece<O> {
    public override name: 'defender' | 'friends' | 'rewards';

    public readonly localization: keyof MessageKeys;

    public readonly cronIncludeAPIData: boolean;

    public readonly cronRequireOnlineStatusAPI: boolean;

    public constructor(context: Module.Context, options: O) {
        super(context, options);

        this.name = options.name;
        this.localization = options.localization;
        this.cronIncludeAPIData = options.cronIncludeAPIData;
        this.cronRequireOnlineStatusAPI = options.cronRequireOnlineStatusAPI ?? false;
    }

    public cron?(user: User): Promise<void>;

    public event?(user: User): Promise<void>;
}

export interface ModuleOptions extends Piece.Options {
    readonly name: 'defender' | 'friends' | 'rewards';
    readonly localization: keyof MessageKeys;
    readonly cronIncludeAPIData: boolean;
    readonly cronRequireOnlineStatusAPI?: boolean;
}

export namespace Module {
    export type Options = ModuleOptions;
    export type Context = Piece.Context;
}
