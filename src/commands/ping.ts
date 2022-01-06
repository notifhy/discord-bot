import type { ClientCommand } from '../@types/client';
import { BetterEmbed } from '../util/utility';
import {
    ColorResolvable,
    CommandInteraction,
    Message,
} from 'discord.js';
import { Log } from '../util/Log';
import { RegionLocales } from '../../locales/localesHandler';
import Constants from '../util/Constants';

export const properties: ClientCommand['properties'] = {
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

export const execute: ClientCommand['execute'] = async (
    interaction: CommandInteraction,
    { userData },
): Promise<void> => {
    const locale = RegionLocales.locale(userData.language).commands.ping;
    const replace = RegionLocales.replace;

    const initialPingEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(locale.embed1.title);

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
        .setTitle(locale.embed2.title)
        .setDescription(
            replace(locale.embed2.description, {
                wsPing: interaction.client.ws.ping,
                rtPing: roundTripDelay,
            }),
        );

    Log.command(interaction, `WS: ${interaction.client.ws.ping}ms | RT: ${roundTripDelay}ms`);

    await interaction.editReply({ embeds: [pingEmbed] });
};
