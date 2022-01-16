/* eslint-disable no-unused-vars */
import type { ClientModule } from './modules';
import type {
    ChatInputApplicationCommandData,
    Collection,
    CommandInteraction,
} from 'discord.js';
import type { HypixelManager } from '../hypixel/HypixelManager';

export interface WebhookConfig {
    id: string,
    token: string,
}

export interface Config {
    blockedGuilds: string[],
    blockedUsers: string[],
    devMode: boolean,
    enabled: boolean,
}

export interface EventProperties {
    name: string,
    once: boolean,
}

export interface ClientEvent {
    properties: EventProperties,
    execute(...parameters: unknown[]): Promise<void> | void,
}

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

declare module 'discord.js' {
    interface Client {
        commands: Collection<string, ClientCommand>,
        cooldowns: Collection<string, Collection<string, number>>,
        config: Config,
        customStatus: string | null,
        events: Collection<string, ClientEvent>,
        hypixel: HypixelManager,
        modules: Collection<string, ClientModule>,
    }
}