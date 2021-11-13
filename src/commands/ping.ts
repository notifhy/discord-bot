import type { CommandExecute, CommandProperties } from '../@types/client';
import { ColorResolvable, CommandInteraction, Message } from 'discord.js';
import { BetterEmbed } from '../util/utility';

export const properties: CommandProperties = {
  name: 'ping',
  description: 'Returns the ping of the bot',
  usage: '/ping',
  cooldown: 5_000,
  ephemeral: true,
  noDM: false,
  ownerOnly: false,
  structure: {
    name: 'ping',
    description: 'Ping!',
  },
};

export const execute: CommandExecute = async (interaction: CommandInteraction, { userData }): Promise<void> => {
  const locale = interaction.client.regionLocales.locale(userData.language).commands.ping;
  const replace = interaction.client.regionLocales.replace;
  const initialPingEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .setTitle(locale.embed1.title);

	const sentReply = await interaction.editReply({ embeds: [initialPingEmbed] });
  const roundTripDelay = (sentReply instanceof Message ? sentReply.createdTimestamp : Date.parse(sentReply.timestamp)) - interaction.createdTimestamp;
  const embedColor: ColorResolvable = interaction.client.ws.ping < 80 && roundTripDelay < 160 ? '#00AA00' : interaction.client.ws.ping < 100 && roundTripDelay < 250 ? '#FFAA00' : '#FF5555';
  const pingEmbed = new BetterEmbed({ color: embedColor, interaction: interaction, footer: null })
		.setColor(interaction.client.ws.ping < 80 && roundTripDelay < 160 ? '#00AA00' : interaction.client.ws.ping < 100 && roundTripDelay < 250 ? '#FFAA00' : '#FF5555')
		.setTitle(locale.embed2.title)
    .setDescription(replace(locale.embed2.description, {
      wsPing: interaction.client.ws.ping,
      rtPing: roundTripDelay,
    }));
	await interaction.editReply({ embeds: [pingEmbed] });
};