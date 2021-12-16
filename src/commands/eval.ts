import type { CommandExecute, CommandProperties } from '../@types/client';
import { BetterEmbed } from '../util/utility';
import { CommandInteraction } from 'discord.js';
import Constants from '../util/Constants';

export const properties: CommandProperties = {
    name: 'eval',
    description: 'Evaluates a string',
    usage: '/eval [string]',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    structure: {
        name: 'eval',
        description: 'Eval',
        options: [
            {
                name: 'string',
                type: 3,
                description: 'Code',
                required: true,
            },
        ],
    },
};

export const execute: CommandExecute = async (
    interaction: CommandInteraction,
): Promise<void> => {
    const input = interaction.options.getString('string', true);

    try {
        const start = Date.now();
        const output = await eval(input); //eslint-disable-line no-eval
        const end = Date.now();
        const timeTaken = end - start;
        const outputMaxLength = Boolean(
            output?.length >= Constants.limits.embedField,
        );
        const evalEmbed = new BetterEmbed({
            color: Constants.colors.normal,
            footer: interaction,
        })
            .setTitle('Executed Eval!')
            .addFields([
                { name: 'Input', value: `\`\`\`javascript\n${input}\n\`\`\`` },
                { name: 'Output', value: `\`\`\`javascript\n${output?.toString()?.slice(0, Constants.limits.embedField)}\n\`\`\`` },
                { name: 'Type', value: `\`\`\`${typeof output}\`\`\`` },
                { name: 'Time Taken', value: `\`\`\`${timeTaken} millisecond${timeTaken === 1 ? '' : 's'}\`\`\`` },
            ]);
        if (outputMaxLength === true) {
            evalEmbed.addField(
                'Over Max Length',
                'The output is over 1024 characters long',
            );
        }

        await interaction.editReply({ embeds: [evalEmbed] });
    } catch (err) {
        if (!(err instanceof Error)) {
            return;
        }

        const outputMaxLength = Boolean(
            err.message.length >= Constants.limits.embedField,
        );
        const evalEmbed = new BetterEmbed({
            color: Constants.colors.warning,
            footer: interaction,
        })
            .setTitle('Failed Eval!')
            .addFields([
                { name: 'Input', value: `\`${input}\`` },
                { name: `${err.name}:`, value: `${err.message.slice(0, Constants.limits.embedField)}` },
            ]);
        if (outputMaxLength === true) {
            evalEmbed.addField(
                'Over Max Length',
                'The error is over 1024 characters long',
            );
        }

        await interaction.editReply({ embeds: [evalEmbed] });
    }
};
