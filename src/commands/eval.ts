import type { ClientCommand } from '../@types/client';
import { BetterEmbed } from '../util/utility';
import { Formatters } from 'discord.js';
import { Log } from '../util/Log';
import { RegionLocales } from '../../locales/RegionLocales';
import Constants from '../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'eval',
    description: 'Evaluates a string.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'eval',
        description: 'Evaluates a string',
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
    interaction,
    locale,
): Promise<void> => {
    const text = RegionLocales.locale(locale).commands.eval;
    const { replace } = RegionLocales;

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
            .setTitle(text.success.title)
            .addFields([
                {
                    name: text.success.input.name,
                    value: replace(text.success.input.value, {
                        input: Formatters.codeBlock('javascript', input),
                    }),
                },
                {
                    name: text.success.output.name,
                    value: replace(text.success.output.value, {
                        output: Formatters.codeBlock(
                            'javascript',
                            output
                                ?.toString()
                                ?.slice(0, Constants.limits.embedField)),
                    }),
                },
                {
                    name: text.success.type.name,
                    value: replace(text.success.type.value, {
                        type: Formatters.codeBlock(typeof output),
                    }),
                },
                {
                    name: text.success.timeTaken.name,
                    value: replace(text.success.timeTaken.value, {
                        ms: Formatters.codeBlock(`${timeTaken}ms`),
                    }),
                },
            ]);

        if (outputMaxLength === true) {
            evalEmbed.addField(
                text.maxLength.name,
                text.maxLength.value,
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
            .setTitle(text.fail.title)
            .addField(
                text.fail.input.name,
                replace(text.fail.input.value, {
                    input: Formatters.codeBlock('javascript', input),
                }),
            );

        if (outputMaxLength === true) {
            evalEmbed.addField(
                text.maxLength.name,
                text.maxLength.value,
            );
        }

        const errorStackAttachment = {
            attachment: Buffer.from(
                error instanceof Error &&
                error.stack
                    ? error.stack
                    : JSON.stringify(
                        error,
                        Object.getOwnPropertyNames(error),
                        2,
                    ),
            ),
            name: error instanceof Error
                ? `${error.name}.txt`
                : 'error.txt',
        };

        await interaction.editReply({
            embeds: [evalEmbed],
            files: [errorStackAttachment],
        });
    }
};