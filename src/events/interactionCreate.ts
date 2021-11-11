import type { EventProperties, SlashCommand } from '../@types/client';
import { BetterEmbed, cleanRound, formattedUnix, timeout } from '../util/utility';
import { ownerID } from '../../config.json';
import { Collection, CommandInteraction } from 'discord.js';
import { ConstraintError } from '../util/error/ConstraintError';
import { SQLiteWrapper } from '../database';
import { UserAPIData, UserData } from '../@types/database';
import errorHandler from '../util/error/errorHandler';


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

      console.log(`${formattedUnix({ date: true, utc: true })} | Slash Command from ${interaction.user.tag} (${interaction.user.id}) for the command ${interaction.commandName}`);

      await interaction.deferReply({ ephemeral: command.properties.ephemeral });

      const { blockedUsers, devMode }: { blockedUsers: string[], devMode: boolean } = interaction.client.config;

      const userAPIData = await SQLiteWrapper.getUser({
        discordID: interaction.user.id,
        table: 'api',
        columns: ['*'],
      }) as UserAPIData | undefined;

      const userData = //how do i make this look good
      (await SQLiteWrapper.getUser({
        discordID: interaction.user.id,
        table: 'users',
        columns: ['*'],
      }) as UserData | undefined) ??
      (await SQLiteWrapper.newUser({
        table: 'users',
        data: {
          discordID: interaction.user.id,
          language: 'en-us',
        },
      }) as UserData);


      await blockedConstraint(interaction, userData, blockedUsers);
      await devConstraint(interaction, userData, Boolean(devMode));
      await ownerConstraint(interaction, userData, command);
      await dmConstraint(interaction, userData, command);
      await cooldownConstraint(interaction, userData, command);
      await command.execute(interaction, {
        userData,
        userAPIData,
      });
    }
  } catch (error) {
    await errorHandler({ error: error, interaction: interaction });
  }
};

async function blockedConstraint(interaction: CommandInteraction, userData: UserData, blockedUsers: string[]) {
  const locales = interaction.client.regionLocales;
  if (blockedUsers.includes(interaction.user.id)) {
    const blockedEmbed = new BetterEmbed({ color: '#AA0000', interaction: interaction, footer: null })
			.setTitle(locales.localizer('constraints.blockedUser.title', userData.language))
			.setDescription(locales.localizer('constraints.blockedUser.description', userData.language));
		await interaction.editReply({ embeds: [blockedEmbed] });
    throw new ConstraintError('Blocked User');
  }
}

async function devConstraint(interaction: CommandInteraction, userData: UserData, devMode: boolean) {
  const locales = interaction.client.regionLocales;
  if (devMode === true && ownerID.includes(interaction.user.id) === false) {
    const devModeEmbed = new BetterEmbed({ color: '#AA0000', interaction: interaction, footer: null })
			.setTitle(locales.localizer('constraints.devMode.title', userData.language))
			.setDescription(locales.localizer('constraints.devMode.description', userData.language));
		await interaction.editReply({ embeds: [devModeEmbed] });
    throw new ConstraintError('Developer Mode');
  }
}

async function ownerConstraint(interaction: CommandInteraction, userData: UserData, command: SlashCommand) {
  const locales = interaction.client.regionLocales;
  if (command.properties.ownerOnly === true && ownerID.includes(interaction.user.id) === false) {
    const ownerEmbed = new BetterEmbed({ color: '#AA0000', interaction: interaction, footer: null })
      .setTitle(locales.localizer('constraints.owner.title', userData.language))
     .setDescription(locales.localizer('constraints.owner.description', userData.language));
   await interaction.editReply({ embeds: [ownerEmbed] });
   throw new ConstraintError('Owner Requirement');
 }
}

async function dmConstraint(interaction: CommandInteraction, userData: UserData, command: SlashCommand) {
  const locales = interaction.client.regionLocales;
  if (command.properties.noDM === true && interaction.guild === null) {
    const dmEmbed = new BetterEmbed({ color: '#AA0000', interaction: interaction, footer: null })
      .setTitle(locales.localizer('constraints.dm.title', userData.language))
      .setDescription(locales.localizer('constraints.dm.description', userData.language));
    await interaction.editReply({ embeds: [dmEmbed] });
    throw new ConstraintError('DM Channel');
  }
}

async function cooldownConstraint(interaction: CommandInteraction, userData: UserData, command: SlashCommand) {
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
      .setTitle(locales.localizer('constraints.cooldown.embed1.title', userData.language))
      .setDescription(locales.localizer('constraints.cooldown.embed1.description', userData.language, {
        cooldown: cleanRound(command.properties.cooldown / 1000),
        timeLeft: timeLeft / 1000,
      }));

    await interaction.editReply({ embeds: [cooldownEmbed] });
    await timeout(timeLeft);

    const cooldownOverEmbed = new BetterEmbed({ color: '#00AA00', interaction: interaction, footer: null })
      .setTitle(locales.localizer('constraints.cooldown.embed2.title', userData.language))
      .setDescription(locales.localizer('constraints.cooldown.embed2.description', userData.language, {
        commandName: command.properties.name,
      }));

    await interaction.editReply({ embeds: [cooldownOverEmbed] });
    throw new ConstraintError('Cooldown');
  }

  timestamps.set(interaction.user.id, Date.now());
}