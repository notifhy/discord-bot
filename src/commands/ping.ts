import {
    ColorResolvable,
    Message,
} from 'discord.js';
import { type ClientCommand } from '../@types/client';
import { RegionLocales } from '../locales/RegionLocales';
import { Constants } from '../utility/Constants';
import { Log } from '../utility/Log';
import { BetterEmbed } from '../utility/utility';

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
    const { replace } = RegionLocales;

    const initialPingEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(text.embed1.title);

    const sentReply = await interaction.editReply({
        embeds: [initialPingEmbed],
    });

    const roundTripDelay = (sentReply instanceof Message
        ? sentReply.createdTimestamp
        : Date.parse(sentReply.timestamp)) - interaction.createdTimestamp;

    const mixedPing = (
        interaction.client.ws.ping + roundTripDelay
    ) / 2;

    let embedColor: ColorResolvable;

    if (mixedPing < 100) {
        embedColor = Constants.colors.on;
    } else if (mixedPing < 200) {
        embedColor = Constants.colors.ok;
    } else {
        embedColor = Constants.colors.warning;
    }

    const pingEmbed = new BetterEmbed(interaction)
        .setColor(embedColor)
        .setTitle(text.embed2.title)
        .setDescription(replace(text.embed2.description, {
            wsPing: interaction.client.ws.ping,
            rtPing: roundTripDelay,
        }));

    Log.interaction(interaction, `WS: ${interaction.client.ws.ping}ms | RT: ${roundTripDelay}ms`);

    await interaction.editReply({ embeds: [pingEmbed] });
};