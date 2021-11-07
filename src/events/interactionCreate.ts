import type { EventProperties, SlashCommand } from '../@types/index';
import { BetterEmbed, formattedUnix, sendWebHook, timeout } from '../util/utility';
import { CommandErrorEmbed, ConstraintEmbed, ErrorStackEmbed, HTTPErrorEmbed, replyToError, UserCommandErrorEmbed, UserHTTPErrorEmbed } from '../util/error/helper';
import { fatalWebhook, nonFatalWebhook, ownerID } from '../../config.json';
import { Collection, CommandInteraction } from 'discord.js';
import { ConstraintError } from '../util/error/ConstraintError';
import * as fs from 'fs/promises';
import { SQLiteWrapper } from '../database';
import { UserAPIData, UserData } from '../@types/database';
import { HTTPError } from '../util/error/HTTPError';

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
      const { blockedUsers, devMode }: { blockedUsers: string[], devMode: string } = JSON.parse(file.toString());

      console.log(`${formattedUnix({ date: true, utc: true })} | Slash Command from ${interaction.user.tag} for the command ${interaction.commandName}`);

      await interaction.deferReply({ ephemeral: command.properties.ephemeral });

      const userData = await new SQLiteWrapper().getUser({ discordID: interaction.user.id, table: 'users' }) as UserData; //or undefined after Permissions v2
      const userAPIData = await new SQLiteWrapper().getUser({ discordID: interaction.user.id, table: 'api' }) as UserAPIData;

      await blockedConstraint(interaction, blockedUsers);
      await devConstraint(interaction, Boolean(devMode));
      await ownerConstraint(interaction, command);
      await dmConstraint(interaction, command);
      await cooldownConstraint(interaction, command);
      await command.execute(interaction, {
        userData,
        userAPIData,
      });
    }
  } catch (error) {
    if (!(error instanceof Error)) return; //=== false doesn't work for this. Very intuitive. ts(2571)
    if (error instanceof ConstraintError) {
      console.log(`${formattedUnix({ date: true, utc: true })} | ${interaction.user.tag} failed the constraint ${error.message} in interaction ${interaction.id}`);
      const constraintErrorEmbed = new ConstraintEmbed({ error: error, interaction: interaction });
      await sendWebHook({ embed: [constraintErrorEmbed], webhook: nonFatalWebhook });
      return;
    }

    console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred | ${error.stack ?? error.message}`);
    const incidentID = Math.random().toString(36).substring(2, 10).toUpperCase();
    const stackEmbed = new ErrorStackEmbed({ error: error, incidentID: incidentID });
    let userErrorEmbed, errorEmbed;

    if (error instanceof HTTPError) { //Unsightly, but it does work (I think)
      userErrorEmbed = new UserHTTPErrorEmbed({ error: error, interaction: interaction, incidentID: incidentID });
      errorEmbed = new HTTPErrorEmbed({ error: error, interaction: interaction, incidentID: incidentID });
    } else {
      userErrorEmbed = new UserCommandErrorEmbed({ error: error, interaction: interaction, incidentID: incidentID });
      errorEmbed = new CommandErrorEmbed({ error: error, interaction: interaction, incidentID: incidentID });
    }
    await replyToError({ embeds: [userErrorEmbed], interaction: interaction, incidentID: incidentID });
    await sendWebHook({
      embed: [errorEmbed, stackEmbed],
      webhook: error instanceof HTTPError ? nonFatalWebhook : fatalWebhook,
      suppressError: true,
    });
  }
};

async function blockedConstraint(interaction: CommandInteraction, blockedUsers: string[]) {
  const locales = interaction.client.regionLocales;
  if (blockedUsers.includes(interaction.user.id)) {
    const blockedEmbed = new BetterEmbed({ color: '#AA0000', interaction: interaction, footer: null })
			.setTitle(locales.localizer('constraints.blockedUser.title', undefined))
			.setDescription(locales.localizer('constraints.blockedUser.description', undefined));
		await interaction.editReply({ embeds: [blockedEmbed] });
    throw new ConstraintError('Blocked User');
  }
}

async function devConstraint(interaction: CommandInteraction, devMode: boolean) {
  const locales = interaction.client.regionLocales;
  if (devMode === true && ownerID.includes(interaction.user.id) === false) {
    const devModeEmbed = new BetterEmbed({ color: '#AA0000', interaction: interaction, footer: null })
			.setTitle(locales.localizer('constraints.devMode.title', undefined))
			.setDescription(locales.localizer('constraints.devMode.description', undefined));
		await interaction.editReply({ embeds: [devModeEmbed] });
    throw new ConstraintError('Developer Mode');
  }
}

async function ownerConstraint(interaction: CommandInteraction, command: SlashCommand) {
  const locales = interaction.client.regionLocales;
  if (command.properties.ownerOnly === true && ownerID.includes(interaction.user.id) === false) {
    const ownerEmbed = new BetterEmbed({ color: '#AA0000', interaction: interaction, footer: null })
      .setTitle(locales.localizer('constraints.owner.title', undefined))
     .setDescription(locales.localizer('constraints.owner.description', undefined));
   await interaction.editReply({ embeds: [ownerEmbed] });
   throw new ConstraintError('Owner Requirement');
 }
}

async function dmConstraint(interaction: CommandInteraction, command: SlashCommand) {
  const locales = interaction.client.regionLocales;
  if (command.properties.noDM === true && interaction.guild === null) {
    const dmEmbed = new BetterEmbed({ color: '#AA0000', interaction: interaction, footer: null })
      .setTitle(locales.localizer('constraints.dm.title', undefined))
      .setDescription(locales.localizer('constraints.dm.description', undefined));
    await interaction.editReply({ embeds: [dmEmbed] });
    throw new ConstraintError('DM Channel');
  }
}

async function cooldownConstraint(interaction: CommandInteraction, command: SlashCommand) {
  const locales = interaction.client.regionLocales;
  const { cooldowns } = interaction.client;

  if (cooldowns.has(command.properties.name) === false) cooldowns.set(command.properties.name, new Collection());

  const timestamps = cooldowns.get(command.properties.name);
  if (timestamps === undefined) return;
  const userCooldown = timestamps.get(interaction.user.id);
  const expirationTime = userCooldown ? userCooldown + command.properties.cooldown : undefined;

  //Adding 2500 milliseconds forces a minimum cooldown time of 2.5 seconds
  if (expirationTime && Date.now() + 2500 < expirationTime) {
    const timeLeft = expirationTime - Date.now();
    const cooldownEmbed = new BetterEmbed({ color: '#AA0000', interaction: interaction, footer: null })
      .setTitle(locales.localizer('constraints.cooldown.embed1.title', undefined))
      .setDescription(locales.localizer('constraints.cooldown.embed1.description', undefined, {
        cooldown: command.properties.cooldown / 1000,
        timeLeft: timeLeft / 1000,
      }));

    await interaction.editReply({ embeds: [cooldownEmbed] });
    await timeout(timeLeft);

    const cooldownOverEmbed = new BetterEmbed({ color: '#00AA00', interaction: interaction, footer: null })
      .setTitle(locales.localizer('constraints.cooldown.embed2.title', undefined))
      .setDescription(locales.localizer('constraints.cooldown.embed2.description', undefined, {
        commandName: command.properties.name,
      }));

    await interaction.editReply({ embeds: [cooldownOverEmbed] });
    throw new ConstraintError('Cooldown');
  }

  timestamps.set(interaction.user.id, Date.now());
}