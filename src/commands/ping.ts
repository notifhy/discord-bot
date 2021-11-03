import type { CommandProperties } from '../@types/index';
import { ColorResolvable, CommandInteraction, Message } from 'discord.js';
import { BetterEmbed } from '../util/utility';

export const properties: CommandProperties = {
  name: 'ping',
  description: 'Returns the ping of the bot',
  usage: '/ping',
  cooldown: 5000,
  noDM: false,
  ownerOnly: false,
  structure: {
    name: 'ping',
    description: 'Ping!',
  },
};

export const execute = async (interaction: CommandInteraction): Promise<void> => {
  const locales = interaction.client.regionLocales;
  const initialPingEmbed = new BetterEmbed({ color: '#7289DA', footer: interaction })
    .setTitle(locales.localizer('commands.ping.embed1.title', 'en-us', {}));

	const sentReply = await interaction.editReply({ embeds: [initialPingEmbed] });
  const roundTripDelay = (sentReply instanceof Message ? sentReply.createdTimestamp : Date.parse(sentReply.timestamp)) - interaction.createdTimestamp;
  const embedColor: ColorResolvable = interaction.client.ws.ping < 80 && roundTripDelay < 160 ? '#00AA00' : interaction.client.ws.ping < 100 && roundTripDelay < 250 ? '#FFAA00' : '#FF5555';
  const pingEmbed = new BetterEmbed({ color: embedColor, footer: interaction })
		.setColor(interaction.client.ws.ping < 80 && roundTripDelay < 160 ? '#00AA00' : interaction.client.ws.ping < 100 && roundTripDelay < 250 ? '#FFAA00' : '#FF5555')
		.setTitle(locales.localizer('commands.ping.embed2.title', 'en-us', {}))
    .setDescription(locales.localizer('commands.ping.embed2.description', 'en-us', {
      wsPing: interaction.client.ws.ping,
      rtPing: roundTripDelay,
    }));
	await interaction.editReply({ embeds: [pingEmbed] });
};