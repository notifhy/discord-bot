import process from 'node:process';
import { ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
import { Byte } from '../enums/Byte';
import { Time } from '../enums/Time';
import { Options } from '../utility/Options';
import { cleanLength, cleanRound } from '../utility/utility';
import { BetterEmbed } from '../structures/BetterEmbed';

export class SystemInfoCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'systeminfo',
            description: 'View system information',
            cooldownLimit: 0,
            cooldownDelay: 0,
            cooldownScope: BucketScope.User,
            preconditions: ['Base', 'DevMode', 'OwnerOnly'],
            requiredUserPermissions: [],
            requiredClientPermissions: [],
        });

        this.chatInputStructure = {
            name: this.name,
            description: this.description,
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const memoryMegaBytes = process.memoryUsage.rss() / Byte.MegaByte;

        const responseEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsSystemInfoTitle'))
            .addFields(
                {
                    name: i18n.getMessage('commandsSystemInfoUptimeName'),
                    value: cleanLength(process.uptime() * Time.Second)!,
                },
                {
                    name: i18n.getMessage('commandsSystemInfoMemoryName'),
                    value: i18n.getMessage('commandsSystemInfoMemberValue', [
                        cleanRound(memoryMegaBytes, 1),
                    ]),
                },
                {
                    name: i18n.getMessage('commandsSystemInfoServersName'),
                    value: String(interaction.client.guilds.cache.size),
                },
                {
                    name: i18n.getMessage('commandsSystemInfoUsersName'),
                    value: String(
                        interaction.client.guilds.cache.reduce(
                            (acc, guild) => acc + guild.memberCount,
                            0,
                        ),
                    ),
                },
            );

        await interaction.editReply({
            embeds: [responseEmbed],
        });
    }
}
