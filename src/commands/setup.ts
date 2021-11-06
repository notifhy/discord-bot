import type { CommandProperties } from '../@types/index';
import { ColorResolvable, CommandInteraction, Message } from 'discord.js';
import { BetterEmbed } from '../util/utility';

export const properties: CommandProperties = {
  name: 'setup',
  description: 'Register and setup your profile',
  usage: '/setup [username/uuid]',
  cooldown: 5000,
  ephemeral: true,
  noDM: false,
  ownerOnly: false,
  structure: {
    name: 'setup',
    description: 'setup!',
    options: [{
      name: 'player',
      type: 'STRING',
      description: 'Your username or UUID',
      required: true,
  }],
  },
};

export const execute = async (interaction: CommandInteraction): Promise<void> => {
  const locales = interaction.client.regionLocales;
  const initialPingEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .setTitle(locales.localizer('commands.ping.embed1.title', undefined));

	const sentReply = await interaction.editReply({ embeds: [initialPingEmbed] });
  const roundTripDelay = (sentReply instanceof Message ? sentReply.createdTimestamp : Date.parse(sentReply.timestamp)) - interaction.createdTimestamp;
  const embedColor: ColorResolvable = interaction.client.ws.ping < 80 && roundTripDelay < 160 ? '#00AA00' : interaction.client.ws.ping < 100 && roundTripDelay < 250 ? '#FFAA00' : '#FF5555';
  const pingEmbed = new BetterEmbed({ color: embedColor, interaction: interaction, footer: null })
		.setColor(interaction.client.ws.ping < 80 && roundTripDelay < 160 ? '#00AA00' : interaction.client.ws.ping < 100 && roundTripDelay < 250 ? '#FFAA00' : '#FF5555')
		.setTitle(locales.localizer('commands.ping.embed2.title', 'en-us'))
    .setDescription(locales.localizer('commands.ping.embed2.description', undefined, {
      wsPing: interaction.client.ws.ping,
      rtPing: roundTripDelay,
    }));
	await interaction.editReply({ embeds: [pingEmbed] });
};