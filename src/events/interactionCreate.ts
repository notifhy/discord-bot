import type { EventProperties, SlashCommand } from '../@types/index';
import { commandEmbed, formattedNow, sendWebHook, timeout } from '../util/utility';
import { constraintEmbedFactory, replyToError } from '../util/error';
import { nonFatalWebHook, ownerID } from '../../config.json';
import { Collection, CommandInteraction } from 'discord.js';
import * as fs from 'fs/promises';

export const properties: EventProperties = {
  name: 'interactionCreate',
  once: false,
  hasParameter: true,
};

export const execute = async (interaction: CommandInteraction): Promise<void> => {
  try {
    if (interaction.isCommand()) {
      const command: SlashCommand | undefined = interaction.client.commands.get(interaction.commandName);
      if (command === undefined) return;

      //Import's cache makes it not refresh uponexecuting this file ¯\_(ツ)_/¯
      const file: Buffer = await fs.readFile('../dynamicConfig.json');
      const { devMode }: { devMode: string } = JSON.parse(file.toString());

      console.log(`${formattedNow({ date: true })} | Slash Command from ${interaction.user.tag} for the command ${interaction.commandName}`);

      await interaction.deferReply({ ephemeral: true });
      await devConstraint(interaction, Boolean(devMode));
      await ownerConstraint(interaction, command);
      await dmConstraint(interaction, command);
      await cooldownConstraint(interaction, command);
      await command.execute(interaction);
    }
  } catch (err) {
    if (!(err instanceof Error)) return; //=== false doesn't work for this. Very intuitive. ts(2571)
    if (err.name === 'ConstraintError') {
      console.log(`${formattedNow({ date: true })} | ${interaction.user.tag} failed the constraint ${err.message} in interaction ${interaction.id}`);
      await sendWebHook({ embed: constraintEmbedFactory({ interaction: interaction, error: err }), webHook: nonFatalWebHook });
      return;
    }
    await replyToError({ error: err, interaction: interaction });
  }
};

async function devConstraint(interaction: CommandInteraction, devMode: boolean) {
  if (devMode === true && !ownerID.includes(interaction.user.id)) {
    const devModeEmbed = commandEmbed({ color: '#AA0000', interaction: interaction })
			.setTitle('Developer Mode!')
			.setDescription('This bot is in developer only mode, likely due to a major issue or an upgrade that is taking place. Please check back later!');
		await interaction.editReply({ embeds: [devModeEmbed] });
    throw constraintError('Developer Mode');
  }
}

async function ownerConstraint(interaction: CommandInteraction, command: SlashCommand) {
  if (command.properties.ownerOnly === true && !ownerID.includes(interaction.user.id)) {
    const ownerEmbed = commandEmbed({ color: '#AA0000', interaction: interaction })
      .setTitle(`Insufficient Permissions!`)
     .setDescription('You cannot execute this command witout being an owner!');
   await interaction.editReply({ embeds: [ownerEmbed] });
   throw constraintError('Owner Requirement');
 }
}

async function dmConstraint(interaction: CommandInteraction, command: SlashCommand) {
  if (command.properties.noDM === true && Boolean(!interaction.guild)) {
     const dmEmbed = commandEmbed({ color: '#AA0000', interaction: interaction })
      .setTitle(`DM Channel!`)
      .setDescription('You cannot execute this command in the DM channel! Please switch to a server channel!');
    await interaction.editReply({ embeds: [dmEmbed] });
    throw constraintError('DM Channel');
  }
}

async function cooldownConstraint(interaction: CommandInteraction, command: SlashCommand) {
  const { cooldowns } = interaction.client;

  if (!cooldowns.has(command.properties.name)) cooldowns.set(command.properties.name, new Collection());

  const timestamps = cooldowns.get(command.properties.name);
  const userCooldown = timestamps!.get(interaction.user.id);
  const expirationTime = userCooldown ? userCooldown + command.properties.cooldown : undefined;

  //Adding 1000 milliseconds forces a minimum cooldown tiem of 1 second
  if (expirationTime && Date.now() + 1000 < expirationTime) {
    const timeLeft = (expirationTime - Date.now()) / 1000;
    const cooldownEmbed = commandEmbed({ color: '#AA0000', interaction: interaction })
      .setTitle(`Cooldown!`)
      .setDescription(`You are executing commands too fast! This cooldown of this command is ${command.properties.cooldown / 1000}. This message will turn green in ${timeLeft} after the cooldown expires.`);

    await interaction.editReply({ embeds: [cooldownEmbed] });
    await timeout(timeLeft);

    const cooldownOverEmbed = commandEmbed({ color: '#AA0000', interaction: interaction })
      .setTitle('Cooldown Over!')
      .setDescription(`The cooldown has expired! You can now execute the command ${interaction.commandName}!`);

    await interaction.editReply({ embeds: [cooldownOverEmbed] });
    throw constraintError('Cooldown');
  }

  timestamps!.set(interaction.user.id, Date.now());
}

function constraintError(message?: string) {
  const constraint = new Error(message);
  constraint.name = 'ConstraintError';
  return constraint;
}