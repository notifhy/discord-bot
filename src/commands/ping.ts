import type { CommandProperties } from '../@types/index';
import { CommandInteraction, Message } from 'discord.js';
import { commandEmbed } from '../util/utility';

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
  const initialPingEmbed = commandEmbed({ color: '#7289DA', interaction: interaction })
    .setTitle(`Pinging..`);

	const sentReply = await interaction.editReply({ embeds: [initialPingEmbed] });
  const roundTripDelay = (sentReply instanceof Message ? sentReply.createdTimestamp : Date.parse(sentReply.timestamp)) - interaction.createdTimestamp;
  const embedColor = interaction.client.ws.ping < 80 && roundTripDelay < 160 ? '#00AA00' : interaction.client.ws.ping < 100 && roundTripDelay < 250 ? '#FFAA00' : '#FF5555';
  const pingEmbed = commandEmbed({ color: embedColor, interaction: interaction })
		.setColor(interaction.client.ws.ping < 80 && roundTripDelay < 160 ? '#00AA00' : interaction.client.ws.ping < 100 && roundTripDelay < 250 ? '#FFAA00' : '#FF5555')
		.setTitle(`🏓 Ping!`)
		.setDescription(`Websocket heartbeat is ${interaction.client.ws.ping}ms. This interaction took ${roundTripDelay}ms from registering the slash command to displaying the initial message.`);
	await interaction.editReply({ embeds: [pingEmbed] });
};