/* eslint-disable no-unused-vars */
import type {
    ChatInputApplicationCommandData,
    Collection,
    CommandInteraction,
} from 'discord.js';
import type { ClientModule } from './modules';
import type { Core } from '../core/core';

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
    core: boolean,
    devMode: boolean,
    keyPercentage: number,
    restRequestTimeout: number,
    retryLimit: number,
}

export interface WebhookConfig {
    id: string,
    token: string,
}

declare module 'discord.js' {
    interface Client {
        commands: Collection<string, ClientCommand>,
        config: Config,
        cooldowns: Collection<string, Collection<string, number>>,
        core: Core,
        customPresence: PresenceData | null,
        events: Collection<string, ClientEvent>,
        modules: Collection<string, ClientModule>,
    }
}