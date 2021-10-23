import type { Collection, CommandInteraction, Client as DiscordClient } from 'discord.js';

export interface ClientEvents {
  name: string;
  once: boolean;
  hasParameter: boolean;
  execute(client?: DiscordClient, ...hasParameter: unknown[]): Promise<void> | void;
}

export interface SlashCommand {
  name: string;
  cooldown: number;
  noDM: boolean;
  ownerOnly: boolean;
  structure: object;
  execute(interaction: CommandInteraction): Promise<void>;
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

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, SlashCommand>;
    cooldowns: Collection<string, Collection<string, number>>;
  }
}