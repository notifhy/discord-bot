import type { users as User } from '@prisma/client';
import { Piece } from '@sapphire/framework';
import type { MessageComponentInteraction } from 'discord.js';
import type { CleanHypixelData } from '../@types/Hypixel';
import type { MessageKeys } from '../locales/locales';
import type { Changes } from './Hypixel';

export class Module<O extends Module.Options = Module.Options> extends Piece<O> {
    public override name: 'defender' | 'friends' | 'playtime' | 'rewards';

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

    public cron?(user: User, data: CleanHypixelData, changes: Changes): Promise<void>;

    public cron?(user: User): Promise<void>;

    public event?(user: User): Promise<void>;

    public interaction?(user: User, interaction: MessageComponentInteraction): Promise<void>;
}

export interface ModuleOptions extends Piece.Options {
    readonly name: 'defender' | 'friends' | 'playtime' | 'rewards';
    readonly localization: keyof MessageKeys;
    readonly cronIncludeAPIData: boolean;
    readonly cronRequireOnlineStatusAPI?: boolean;
}

export namespace Module {
    export type Options = ModuleOptions;
    export type Context = Piece.Context;
}
