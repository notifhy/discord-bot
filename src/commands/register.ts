import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import { type CommandInteraction, Constants } from 'discord.js';
import type { RawHypixelPlayer } from '../@types/Hypixel';
import { Requests } from '../core/Requests';
import { Options } from '../utility/Options';

export class PresenceCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'register',
            description: 'Register your Minecraft account and begin using modules',
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
            options: [
                {
                    name: 'player',
                    type: Constants.ApplicationCommandOptionTypes.STRING,
                    description: 'Your username or UUID',
                    required: true,
                },
            ],
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: CommandInteraction) {
        const uuid = interaction.options.getString('player', true);

        const playerURL = new URL(Options.hypixelPlayerURL);
        playerURL.searchParams.append('uuid', uuid);

        const rawData = await Requests.fetch(playerURL.toString());
        const data = Requests.cleanPlayerData(rawData as RawHypixelPlayer);

        await this.container.database.$transaction([
            this.container.database.users.create({
                data: {
                    id: interaction.user.id,
                    locale: interaction.locale,
                    uuid: uuid,
                },
            }),
            this.container.database.defender.create({
                data: {
                    id: interaction.user.id,
                    ...data.language && {
                        languages: [data.language],
                    },
                    ...data.version && {
                        versions: [data.version],
                    },
                },
            }),
            this.container.database.friends.create({
                data: {
                    id: interaction.user.id,
                },
            }),
            this.container.database.rewards.create({
                data: {
                    id: interaction.user.id,
                },
            }),
        ]);
    }
}
