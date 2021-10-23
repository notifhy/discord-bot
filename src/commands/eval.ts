import { CommandInteraction } from 'discord.js';
import { commandEmbed, isInstanceOfError } from '../utility';

export const name = 'eval';
export const cooldown = 5000;
export const noDM = false;
export const ownerOnly = true;

export const execute = async (interaction: CommandInteraction) => {
  const input = interaction.options.getString('string') as string;

  try {
    const output = await eval(input);
    const outputMaxLength = Boolean(output.length >= 1024);
    const evalEmbed = commandEmbed('#7289DA', 'Slash Command', `/${interaction.commandName}`)
      .setTitle('Executed Eval!')
      .addField(`Input`, `\`${input}\``)
      .addField(`Output`, `\`${output}\``);
    if (outputMaxLength === true) evalEmbed.addField('Over Max Length', 'The output is over 4096 characters long');

    await interaction.editReply({ embeds: [evalEmbed] });
  } catch (err) {
    if (!isInstanceOfError(err)) return;
    const outputMaxLength = Boolean(err.message.length >= 1024);
    const evalEmbed = commandEmbed('#FF5555', 'Slash Command', `/${interaction.commandName}`)
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