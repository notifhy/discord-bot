import type {
    ChatInputApplicationCommandData,
    MessageApplicationCommandData,
    UserApplicationCommandData,
} from 'discord.js';

declare module '@sapphire/framework' {
    interface Command {
        chatInputStructure: ChatInputApplicationCommandData;
        contextMenuStructure?: UserApplicationCommandData | MessageApplicationCommandData;
    }
}
