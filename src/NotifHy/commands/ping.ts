import type { ClientCommand } from '../../@types/client';
import { BetterEmbed } from '../../util/utility';
import {
    ColorResolvable,
    Message,
} from 'discord.js';
import { Log } from '../../util/Log';
import { RegionLocales } from '../../../locales/RegionLocales';
import Constants from '../../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'ping',
    description: 'Returns the ping of the bot.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'ping',
        description: 'Ping!',
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const text = RegionLocales.locale(locale).commands.ping;
    const replace = RegionLocales.replace;

    const initialPingEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(text.embed1.title);

    const sentReply = await interaction.editReply({
        embeds: [initialPingEmbed],
    });

    const roundTripDelay =
        (sentReply instanceof Message
            ? sentReply.createdTimestamp
            : Date.parse(sentReply.timestamp)) - interaction.createdTimestamp;

    const embedColor: ColorResolvable =
        interaction.client.ws.ping < 80 && roundTripDelay < 160
            ? Constants.colors.on
            : interaction.client.ws.ping < 100 && roundTripDelay < 250
            ? Constants.colors.ok
            : Constants.colors.warning;

    const pingEmbed = new BetterEmbed(interaction)
        .setColor(embedColor)
        .setTitle(text.embed2.title)
        .setDescription(replace(text.embed2.description, {
            wsPing: interaction.client.ws.ping,
            rtPing: roundTripDelay,
        }));

    Log.command(interaction, `WS: ${interaction.client.ws.ping}ms | RT: ${roundTripDelay}ms`);

    await interaction.editReply({ embeds: [pingEmbed] });
};