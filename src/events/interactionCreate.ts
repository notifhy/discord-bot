import { Collection, CommandInteraction } from 'discord.js';
import { replyToError, timeout, commandEmbed, isInstanceOfError } from '../utility';
import { ownerID } from '../../config.json';
import type { SlashCommand } from '../@types/index';

export const name = 'interactionCreate';
export const once = false;
export const hasParameter = true;

export const execute = async (interaction: CommandInteraction) => {
  try {
    if (interaction.isCommand()) {
      const command: SlashCommand | undefined = interaction.client.commands.get(interaction.commandName);
      if (command === undefined) return;

      await interaction.deferReply({ ephemeral: true });
      await ownerConstraint(interaction, command);
      await dmConstraint(interaction, command);
      await cooldownConstraint(interaction, command);
      await command.execute(interaction);
    }
  } catch (err) {
    if (!isInstanceOfError(err)) return; //=== false doesn't work for this. Very intuitive. ts(2571)
    if (err.name === 'ConstraintError') return; //Add logging
    await replyToError({ error: err, interaction: interaction });
  }
};

async function ownerConstraint(interaction: CommandInteraction, command: SlashCommand) {
  if (command.ownerOnly === true && !ownerID.includes(interaction.user.id)) {
    const ownerEmbed = commandEmbed('#AA0000', 'Slash Command', `/${interaction.commandName}`)
      .setTitle(`Insufficient Permissions!`)
     .setDescription('You cannot execute this command witout being an owner!');
   await interaction.editReply({ embeds: [ownerEmbed] });
   throw constraintError();
 }
}

async function dmConstraint(interaction: CommandInteraction, command: SlashCommand) {
  if (command.noDM === true && Boolean(!interaction.guild)) {
     const dmEmbed = commandEmbed('#AA0000', 'Slash Command', `/${interaction.commandName}`)
      .setTitle(`DM Channel!`)
      .setDescription('You cannot execute this command in the DM channel! Please switch to a server channel!');
    await interaction.editReply({ embeds: [dmEmbed] });
    throw constraintError();
  }
}

async function cooldownConstraint(interaction: CommandInteraction, command: SlashCommand) {
  const { cooldowns } = interaction.client;

  if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Collection());

  const timestamps = cooldowns.get(command.name);
  const userCooldown = timestamps!.get(interaction.user.id);
  const expirationTime = userCooldown ? userCooldown + command.cooldown : undefined;

  if (expirationTime && Date.now() < expirationTime) {
    const timeLeft = (expirationTime - Date.now()) / 1000;
    const cooldownEmbed = commandEmbed('#AA0000', 'Slash Command', `/${interaction.commandName}`)
      .setTitle(`Cooldown!`)
      .setDescription(`You are executing commands too fast! This cooldown of this command is ${command.cooldown / 1000}. This message will turn green in ${timeLeft} after the cooldown expires.`);

    await interaction.editReply({ embeds: [cooldownEmbed] });
    await timeout(timeLeft);

    const cooldownOverEmbed = commandEmbed('#00AA00', 'Slash Command', `/${interaction.commandName}`)
      .setTitle('Cooldown Over!')
      .setDescription(`The cooldown has expired! You can now execute the command ${interaction.commandName}!`);

    await interaction.editReply({ embeds: [cooldownOverEmbed] });
    throw constraintError();
  }

  timestamps!.set(interaction.user.id, Date.now());
}

function constraintError(message?: string) {
  const constraint = new Error(message);
  constraint.name = 'ConstraintError';
  return constraint;
}