/* eslint-disable no-unused-vars */
import type {
    ChatInputApplicationCommandData,
    Collection,
    CommandInteraction,
} from 'discord.js';
import type { ClientModule } from './modules';
import type { HypixelManager } from '../hypixel/HypixelManager';

export interface ClientCommand {
    properties: {
        name: string,
        description: string,
        cooldown: number,
        ephemeral: boolean,
        noDM: boolean,
        ownerOnly: boolean,
        requireRegistration: boolean,
        structure: ChatInputApplicationCommandData,
    },
    execute: {
        (
            interaction: CommandInteraction,
            locale: string,
            ): Promise<void>,
        },
}

export interface ClientEvent {
    properties: {
        name: string,
        once: boolean
    },
    execute(...parameters: unknown[]): Promise<void> | void,
}

export interface Config {
    blockedGuilds: string[],
    blockedUsers: string[],
    devMode: boolean,
    enabled: boolean,
}

export interface WebhookConfig {
    id: string,
    token: string,
}

declare module 'discord.js' {
    interface Client {
        commands: Collection<string, ClientCommand>,
        cooldowns: Collection<string, Collection<string, number>>,
        config: Config,
        customStatus: ActivityOptions | null,
        events: Collection<string, ClientEvent>,
        hypixel: HypixelManager,
        modules: Collection<string, ClientModule>,
    }
}