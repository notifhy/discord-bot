import type { CommandProperties } from '../@types/index';
import { CommandInteraction } from 'discord.js';
import { BetterEmbed } from '../util/utility';

export const properties: CommandProperties = {
  name: 'eval',
  description: 'Evaluates a string',
  usage: '/eval [string]',
  cooldown: 5000,
  noDM: false,
  ownerOnly: true,
  structure: {
    name: 'eval',
    description: 'Eval',
    options: [{
      name: 'string',
      type: 3,
      description: 'Code',
      required: true,
    }],
  },
};

export const execute = async (interaction: CommandInteraction): Promise<void> => {
  const input = interaction.options.getString('string') as string;

  try {
    const start = Date.now();
    const output = await eval(input);
    const end = Date.now();
    const timeTaken = end - start;
    const outputMaxLength = Boolean(output?.length >= 1024);
    const evalEmbed = new BetterEmbed({ color: '#7289DA', footer: interaction })
      .setTitle('Executed Eval!')
      .addField(`Input`, `\`\`\`javascript\n${input}\n\`\`\``)
      .addField(`Output`, `\`\`\`javascript\n${output}\n\`\`\``)
      .addField('Type', `\`\`\`${typeof output}\`\`\``)
      .addField('Time Taken', `\`\`\`${timeTaken} millisecond${timeTaken === 1 ? '' : 's'}\`\`\``);
    if (outputMaxLength === true) evalEmbed.addField('Over Max Length', 'The output is over 4096 characters long');

    await interaction.editReply({ embeds: [evalEmbed] });
  } catch (err) {
    if (!(err instanceof Error)) return;
    const outputMaxLength = Boolean(err.message.length >= 1024);
    const evalEmbed = new BetterEmbed({ color: '#FF5555', footer: interaction })
      .setTitle('Failed Eval!')
      .addField(`Input`, `\`${input}\``)
      .addField(`${err.name}:`, `${err.message}`);
    if (outputMaxLength === true) evalEmbed.addField('Over Max Length', 'The error is over 4096 characters long');

    await interaction.editReply({ embeds: [evalEmbed] });
  }
};