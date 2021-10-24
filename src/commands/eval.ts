import { CommandInteraction } from 'discord.js';
import { commandEmbed, isInstanceOfError } from '../utility';

export const name = 'eval';
export const description = 'Evaluates a string';
export const usage = '/eval [string]';
export const cooldown = 5000;
export const noDM = false;
export const ownerOnly = true;

export const execute = async (interaction: CommandInteraction) => {
  const input = interaction.options.getString('string') as string;

  try {
    const start = Date.now();
    const output = await eval(input);
    const end = Date.now();
    const timeTaken = end - start;
    const outputMaxLength = Boolean(output?.length >= 1024);
    const evalEmbed = commandEmbed({ color: '#7289DA', interaction: interaction })
      .setTitle('Executed Eval!')
      .addField(`Input`, `\`\`\`javascript\n${input}\n\`\`\``)
      .addField(`Output`, `\`\`\`javascript\n${output}\n\`\`\``)
      .addField('Type', `\`\`\`${typeof output}\`\`\``)
      .addField('Time Taken', `\`\`\`${timeTaken} milisecond${timeTaken === 1 ? '' : 's'}\`\`\``);
    if (outputMaxLength === true) evalEmbed.addField('Over Max Length', 'The output is over 4096 characters long');

    await interaction.editReply({ embeds: [evalEmbed] });
  } catch (err) {
    if (!isInstanceOfError(err)) return;
    const outputMaxLength = Boolean(err.message.length >= 1024);
    const evalEmbed = commandEmbed({ color: '#FF5555', interaction: interaction })
      .setTitle('Failed Eval!')
      .addField(`Input`, `\`${input}\``)
      .addField(`${err.name}:`, `${err.message}`);
    if (outputMaxLength === true) evalEmbed.addField('Over Max Length', 'The error is over 4096 characters long');

    await interaction.editReply({ embeds: [evalEmbed] });
  }
};

export const structure = {
  name: 'eval',
  description: 'Eval',
  options: [{
    name: 'string',
    type: 3,
    description: 'Code',
    required: true,
  }],
};