import type { Collection, CommandInteraction, Client as DiscordClient } from 'discord.js';
import { RequestCreate } from '../hypixelAPI/RequestCreate';
import { User } from './database';

export interface HypixelAPI {
  requests: RequestCreate;
  data: Collection<string, Collection<string, User>>
}

export interface WebHookConfig {
  id: string;
  token: string;
}

export interface Config {
  api: boolean;
  blockedUsers: string[];
  devMode: boolean;
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
  usage: string;
  cooldown: number;
  noDM: boolean;
  ownerOnly: boolean;
  structure: object;
}

export interface CommandExecute {
  (interaction: CommandInteraction): Promise<void>
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
    hypixelAPI: HypixelAPI;
  }
}