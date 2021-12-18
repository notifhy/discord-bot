/* eslint-disable no-unused-vars */
import type { ClientModule } from './modules';
import type { Collection, CommandInteraction } from 'discord.js';
import type { HypixelModuleManager } from '../hypixelAPI/HypixelModuleManager';
import type { UserAPIData, UserData } from './database';

export interface WebHookConfig {
    id: string;
    token: string;
}

export interface Config {
    blockedGuilds: string[];
    blockedUsers: string[];
    devMode: boolean;
    enabled: boolean;
    uses: number;
}

export interface EventProperties {
    name: string;
    once: boolean;
}

export interface ClientEvent {
    properties: EventProperties;
    execute(...parameters: unknown[]): Promise<void> | void;
}

export interface CommandProperties {
    name: string;
    description: string;
    cooldown: number;
    ephemeral: boolean;
    noDM: boolean;
    ownerOnly: boolean;
    structure: object;
    usage: string;
}

export interface CommandExecuteUserData {
    userData: UserData;
    userAPIData?: UserAPIData;
}

export interface CommandExecute {
    (
        interaction: CommandInteraction,
        user: CommandExecuteUserData,
    ): Promise<void>;
}

export interface ClientCommand {
    properties: CommandProperties;
    execute: CommandExecute;
}

declare module 'discord.js' {
    interface Client {
        commands: Collection<string, ClientCommand>;
        cooldowns: Collection<string, Collection<string, number>>;
        config: Config;
        customStatus: string | null;
        events: Collection<string, ClientEvent>;
        hypixelAPI: HypixelModuleManager;
        modules: Collection<string, ClientModule>;
    }
}
