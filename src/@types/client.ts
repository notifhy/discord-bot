import type { Collection, CommandInteraction, Client as DiscordClient } from 'discord.js';
import { ModuleDataResolver } from '../hypixelAPI/ModuleDataResolver';
import { RegionLocales } from '../../locales/localesHandler';
import { UserAPIData, UserData } from './database';

export interface WebHookConfig {
  id: string;
  token: string;
}

export interface Config {
  baseURL: string;
  blockedUsers: string[];
  devMode: boolean;
  enabled: boolean
  uses: number;
}

export interface EventProperties {
  name: string;
  once: boolean;
  hasParameter: boolean;
}

export interface ClientEvents {
  properties: EventProperties;
  execute(client?: DiscordClient, ...hasParameter: unknown[]): Promise<void> | void;
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
  (interaction: CommandInteraction, user: CommandExecuteUserData): Promise<void>
}

export interface SlashCommand {
  properties: CommandProperties;
  execute: CommandExecute;
}

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, SlashCommand>;
    cooldowns: Collection<string, Collection<string, number>>;
    config: Config,
    customStatus: boolean;
    hypixelAPI: ModuleDataResolver;
    regionLocales: RegionLocales;
  }
}