import type { EventProperties, SlashCommand } from '../@types/index';
import { BetterEmbed, formattedUnix, sendWebHook, timeout } from '../util/utility';
import { CommandError, replyToError } from '../util/error/helper';
import { errorWebhook, nonFatalWebHook, ownerID } from '../../config.json';
import { Collection, CommandInteraction } from 'discord.js';
import { ConstraintError } from '../util/error/ConstraintError';
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

      //Import's cache makes it not refresh upon executing this file ¯\_(ツ)_/¯
      const file: Buffer = await fs.readFile('../dynamicConfig.json');
      const { devMode }: { devMode: string } = JSON.parse(file.toString());

      console.log(`${formattedUnix({ date: true, utc: true })} | Slash Command from ${interaction.user.tag} for the command ${interaction.commandName}`);

      await interaction.deferReply({ ephemeral: true });
      await devConstraint(interaction, Boolean(devMode));
      await ownerConstraint(interaction, command);
      await dmConstraint(interaction, command);
      await cooldownConstraint(interaction, command);
      await command.execute(interaction);
    }
  } catch (err) {
    if (!(err instanceof Error)) return; //=== false doesn't work for this. Very intuitive. ts(2571)
    if (err instanceof ConstraintError) {
      console.log(`${formattedUnix({ date: true, utc: true })} | ${interaction.user.tag} failed the constraint ${err.message} in interaction ${interaction.id}`);
      const constraintEmbed = new BetterEmbed({ color: '#AA0000', footer: interaction })
        .setTitle('User Failed Constraints')
        .addField('Constraint Type', err.message)
        .addField('User', `Tag: ${interaction.user.tag}\nID: ${interaction.user.id}`)
        .addField('Interaction', interaction.id)
        .addField('Source', `Channel Type: ${interaction.channel?.type}\nGuild Name: ${interaction.guild?.name}\nGuild ID: ${interaction.guild?.id}\nOwner ID: ${interaction.guild?.ownerId ?? 'None'}\nGuild Member Count: ${interaction.guild?.memberCount}`);
      await sendWebHook({ embed: constraintEmbed, webHook: nonFatalWebHook });
      return;
    }

    const incidentID = Math.random().toString(36).substring(2, 10).toUpperCase();
    const commandError = new CommandError({ error: err, interaction: interaction, incidentID: incidentID });
    await replyToError({ error: err, interaction: interaction, incidentID: incidentID });
    await sendWebHook({ embed: commandError, webHook: errorWebhook, suppressError: true });
  }
};

async function devConstraint(interaction: CommandInteraction, devMode: boolean) {
  if (devMode === true && ownerID.includes(interaction.user.id) === false) {
    const devModeEmbed = new BetterEmbed({ color: '#AA0000', footer: interaction })
			.setTitle('Developer Mode!')
			.setDescription('This bot is in developer only mode, likely due to a major issue or an upgrade that is taking place. Please check back later!');
		await interaction.editReply({ embeds: [devModeEmbed] });
    throw new ConstraintError('Developer Mode');
  }
}

async function ownerConstraint(interaction: CommandInteraction, command: SlashCommand) {
  if (command.properties.ownerOnly === true && ownerID.includes(interaction.user.id) === false) {
    const ownerEmbed = new BetterEmbed({ color: '#AA0000', footer: interaction })
      .setTitle(`Insufficient Permissions!`)
     .setDescription('You cannot execute this command without being an owner!');
   await interaction.editReply({ embeds: [ownerEmbed] });
   throw new ConstraintError('Owner Requirement');
 }
}

async function dmConstraint(interaction: CommandInteraction, command: SlashCommand) {
  if (command.properties.noDM === true && interaction.guild === null) {
     const dmEmbed = new BetterEmbed({ color: '#AA0000', footer: interaction })
      .setTitle(`DM Channel!`)
      .setDescription('You cannot execute this command in the DM channel! Please switch to a server channel!');
    await interaction.editReply({ embeds: [dmEmbed] });
    throw new ConstraintError('DM Channel');
  }
}

async function cooldownConstraint(interaction: CommandInteraction, command: SlashCommand) {
  const { cooldowns } = interaction.client;

  if (cooldowns.has(command.properties.name) === false) cooldowns.set(command.properties.name, new Collection());

  const timestamps = cooldowns.get(command.properties.name);
  if (timestamps === undefined) return;
  const userCooldown = timestamps.get(interaction.user.id);
  const expirationTime = userCooldown ? userCooldown + command.properties.cooldown : undefined;

  //Adding 1000 milliseconds forces a minimum cooldown time of 1 second
  if (expirationTime && Date.now() + 1000 < expirationTime) {
    const timeLeft = (expirationTime - Date.now()) / 1000;
    const cooldownEmbed = new BetterEmbed({ color: '#AA0000', footer: interaction })
      .setTitle(`Cooldown!`)
      .setDescription(`You are executing commands too fast! This cooldown of this command is ${command.properties.cooldown / 1000}. This message will turn green in ${timeLeft} after the cooldown expires.`);

    await interaction.editReply({ embeds: [cooldownEmbed] });
    await timeout(timeLeft);

    const cooldownOverEmbed = new BetterEmbed({ color: '#00AA00', footer: interaction })
      .setTitle('Cooldown Over!')
      .setDescription(`The cooldown has expired! You can now execute the command ${interaction.commandName}!`);

    await interaction.editReply({ embeds: [cooldownOverEmbed] });
    throw new ConstraintError('Cooldown');
  }

  timestamps.set(interaction.user.id, Date.now());
}