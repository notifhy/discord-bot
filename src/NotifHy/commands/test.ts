import type { ClientCommand } from '../@types/client';
import type { DefenderModule } from '../@types/database';
import {
    CommandInteraction,
    MessageEmbed,
    TextChannel,
} from 'discord.js';
import { Constants } from '../utility/Constants';
import { Log } from '../../utility/Log';
import { setTimeout } from 'timers/promises';
import { SQLite } from '../utility/SQLite';

export const properties: ClientCommand['properties'] = {
    name: 'test',
    description: 'Does stuff.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'test',
        description: 'Does stuff',
        options: [
            {
                name: 'delete',
                type: 2,
                description: 'Delete all of your data',
                options: [
                    {
                        name: 'view',
                        description: 'Returns a file with all of your data',
                        type: 1,
                        options: [
                            {
                                name: 'command',
                                type: 3,
                                description:
                                    'A command to get info about. This parameter is completely optional',
                                required: false,
                            },
                        ],
                    },
                ],
            },
        ],
    },
};

/* eslint-disable no-await-in-loop */

export const execute: ClientCommand['execute'] = async (
    interaction: CommandInteraction,
): Promise<void> => {
    const channelIDs = (
        (
            SQLite.getAllUsers<DefenderModule>({
                table: Constants.tables.defender,
                columns: ['channel'],
            })
        )
        .map(user => user.channel)
        .filter(channel => typeof channel === 'string')
    ) as string[];

    const embed = new MessageEmbed()
        .setTitle('Bot Updated 🎉')
        .setDescription('Apologies for the unexpected notification!\n\nTL;DR: Used to be HyGuard, more features, and a Privacy Policy + ToS')
        .addField('New Bot!', 'HyGuard has a new coat of paint, a much needed upgrade, and was renamed to NotifHy. You have been automatically migrated to this new system.\n\nAsides from account protection (which HyGuard offered), you can now also get alerts for friends logging on and reminders for daily rewards. Additionally, data is now tracked, so you can view your history with **/data**. Configuring what kind of notifications you get have gone from 6+ different commands to one; **/modules**.\n\nSee https://attituding.github.io/NotifHy/ for more information about the new bot.')
        .addField('Legal Stuff', 'By using this service, you agree to our [Privacy Policy](https://attituding.github.io/NotifHy/privacy/ "Privacy Policy") and our [Terms of Service](https://attituding.github.io/NotifHy/tos/ "Terms of Service"). To discontinue use of this application, look into **/data delete** and/or contact Attituding. This addition was in part added to comply with Discord\'s verification requirements.');

    for (const channel of channelIDs) {
        try {
            const fetched = await interaction.client.channels.fetch(channel);
            await (fetched as TextChannel)?.send({ embeds: [embed] });
        } catch (error) {
            Log.error(error instanceof Error ? error.message : error, channel);
            await interaction.followUp({ content: `Failed to send for ${channel}` });
        }

        await setTimeout(15_000);
    }

    await interaction.followUp({ content: 'Done!' });
};