import {
    type ChatInputApplicationCommandData,
    type MessageApplicationCommandData,
    type UserApplicationCommandData,
} from 'discord.js';

declare module '@sapphire/framework' {
    interface Command {
        chatInputStructure: ChatInputApplicationCommandData,
        contextMenuStructure?: UserApplicationCommandData | MessageApplicationCommandData,
    }
}