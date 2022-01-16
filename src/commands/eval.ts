import type { ClientCommand } from '../@types/client';
import { BetterEmbed } from '../util/utility';
import {
    CommandInteraction,
    Formatters,
} from 'discord.js';
import { Log } from '../util/Log';
import Constants from '../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'eval',
    description: 'Evaluates a string',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
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

export const execute: ClientCommand['execute'] = async (
    interaction: CommandInteraction,
): Promise<void> => {
    const input = interaction.options.getString('string', true);

    try {
        const start = Date.now();
        const output = await eval(input); //eslint-disable-line no-eval
        const end = Date.now();
        const timeTaken = end - start;
        const outputMaxLength =
            output?.length >= Constants.limits.embedField;

        const evalEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle('Executed Eval!')
            .addFields([
                {
                    name: 'Input', value:
                        Formatters.codeBlock('javascript', input),
                },
                {
                    name: 'Output', value:
                        Formatters.codeBlock('javascript', output?.toString()?.slice(0, Constants.limits.embedField)),
                },
                {
                    name: 'Type', value:
                        Formatters.codeBlock(typeof output),
                },
                {
                    name: 'Time Taken', value:
                        Formatters.codeBlock(`${timeTaken} millisecond${timeTaken === 1 ? '' : 's'}`),
                },
            ]);

        if (outputMaxLength === true) {
            evalEmbed.addField(
                'Over Max Length',
                'The output is over 1024 characters long',
            );
        }

        Log.command(interaction, 'Output: ', output);

        await interaction.editReply({ embeds: [evalEmbed] });
    } catch (error) {
        const outputMaxLength = Boolean(
            (error as Error).message.length >= Constants.limits.embedField,
        );

        const evalEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.warning)
            .setTitle('Failed Eval!')
            .addFields([
                { name: 'Input', value: Formatters.codeBlock('javascript', input) },
                { name: `${(error as Error).name}:`, value: `${(error as Error).stack!.slice(0, Constants.limits.embedField)}` },
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