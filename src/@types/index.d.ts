import type { Collection, CommandInteraction, Client as DiscordClient } from 'discord.js';

export interface WebHookConfig {
  id: string;
  token: string;
}

export interface HTTPError extends Error {
  name: string;
  message: string;
  stack?: string;
  method?: string;
  headers?: string;
  url?: string | null;
  status?: number | null;
  json?: object | null;
}

export interface Config {
  api: boolean;
  blockedUsers: string[];
  devMode: boolean;
  userLimit: number;
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

export interface SlashCommand {
  properties: CommandProperties;
  execute(interaction: CommandInteraction): Promise<void>;
}

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, SlashCommand>;
    cooldowns: Collection<string, Collection<string, number>>;
  }
}