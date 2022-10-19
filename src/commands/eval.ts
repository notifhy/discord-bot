import { EmbedLimits } from '@sapphire/discord-utilities';
import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import { type CommandInteraction, Formatters } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Options } from '../utility/Options';
import { interactionLogContext } from '../utility/utility';

export class EvalCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'eval',
            description: 'Evaluates a string',
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
                    name: 'string',
                    type: ApplicationCommandOptionTypes.STRING,
                    description: 'Code',
                    required: true,
                },
            ],
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const input = interaction.options.getString('string', true);

        const evalEmbed = new BetterEmbed(interaction).addFields({
            name: i18n.getMessage('commandsEvalInputName'),
            value: Formatters.codeBlock('javascript', input),
        });

        const start = Date.now();

        try {
            const output = await eval(input); // eslint-disable-line no-eval
            const end = Date.now();
            const timeTaken = end - start;
            const outputMaxLength = output?.length >= EmbedLimits.MaximumFieldValueLength;

            let jsonStringified;

            try {
                jsonStringified = JSON.stringify(output);
                // eslint-disable-next-line no-empty
            } catch {}

            evalEmbed.setColor(Options.colorsNormal).addFields(
                {
                    name: i18n.getMessage('commandsEvalOutputName'),
                    value: Formatters.codeBlock(
                        'javascript',
                        output?.toString()?.slice(0, EmbedLimits.MaximumFieldValueLength),
                    ),
                },
                {
                    name: i18n.getMessage('commandsEvalStringifiedJSONOutputName'),
                    value: Formatters.codeBlock(
                        'json',
                        String(jsonStringified).slice(0, EmbedLimits.MaximumFieldValueLength),
                    ),
                },
                {
                    name: i18n.getMessage('commandsEvalTypeName'),
                    value: Formatters.codeBlock(typeof output),
                },
                {
                    name: i18n.getMessage('commandsEvalTimeTakenName'),
                    value: Formatters.codeBlock(
                        i18n.getMessage('commandsEvalTimeTakenValue', [timeTaken]),
                    ),
                },
            );

            if (outputMaxLength === true) {
                evalEmbed.addFields({
                    name: i18n.getMessage('commandsEvalMaxLengthName'),
                    value: i18n.getMessage('commandsEvalMaxLengthValue'),
                });
            }

            this.container.logger.info(
                interactionLogContext(interaction),
                `${this.constructor.name}:`,
                output,
            );

            await interaction.editReply({ embeds: [evalEmbed] });
        } catch (error) {
            this.container.logger.warn(
                interactionLogContext(interaction),
                `${this.constructor.name}:`,
                'Encountered error during eval.',
                error,
            );

            const end = Date.now();
            const timeTaken = end - start;

            const outputMaxLength = Boolean(
                (error as Error).message.length >= EmbedLimits.MaximumFieldValueLength,
            );

            evalEmbed.setColor(Options.colorsNormal).addFields({
                name: i18n.getMessage('commandsEvalTimeTakenName'),
                value: Formatters.codeBlock(
                    i18n.getMessage('commandsEvalTimeTakenValue', [timeTaken]),
                ),
            });

            if (outputMaxLength === true) {
                evalEmbed.addFields({
                    name: i18n.getMessage('commandsEvalMaxLengthName'),
                    value: i18n.getMessage('commandsEvalMaxLengthValue'),
                });
            }

            const errorStackAttachment = {
                attachment: Buffer.from(
                    JSON.stringify(error, Object.getOwnPropertyNames(error), 4),
                ),
                name: error instanceof Error ? `${error.name}.txt` : 'error.txt',
            };

            await interaction.editReply({
                embeds: [evalEmbed],
                files: [errorStackAttachment],
            });
        }
    }
}
