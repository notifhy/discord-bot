import { BetterEmbed, formattedUnix, sendWebHook } from '../utility';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { fatalWebhook, ownerID } from '../../../config.json';
import Constants from '../Constants';

export class ErrorStackEmbed extends BetterEmbed {
    constructor(error: unknown, incidentID: string) {
        super({
            name: `Incident ${incidentID}`,
        });

        super.setColor(Constants.colors.error);

        if (error instanceof Error && error.stack) {
            const nonStackLenth = `${error.name}: ${error.message}`.length;
            const stack = error.stack.slice(
                nonStackLenth,
                1024 + nonStackLenth,
            );
            super
                .addField(
                    error.name,
                    error.message.slice(0, Constants.limits.embedField),
                )
                .addField('Trace', stack);
            if ((nonStackLenth >= Constants.limits.embedDescription) === true) {
                super.addField(
                    'Over Max Length',
                    'The stack is over 4096 characters long and was cut short',
                );
            }
        } else {
            super.setDescription(
                JSON.stringify(
                    error,
                    Object.getOwnPropertyNames(error),
                    2,
                ).slice(0, Constants.limits.embedDescription),
            );
        }
    }
}

export async function replyToError({
    embeds,
    interaction,
    incidentID,
}: {
    embeds: MessageEmbed[];
    interaction: CommandInteraction;
    incidentID: string;
}): Promise<void> {
    const payLoad = { embeds: embeds, ephemeral: true };

    try {
        if (interaction.replied === true || interaction.deferred === true) {
            await interaction.followUp(payLoad);
        } else {
            await interaction.reply(payLoad);
        }
    } catch (err) {
        const base = `${formattedUnix({
            date: true,
            utc: true,
        })} | Incident ${incidentID} | Priority: 2`;
        console.error(
            `${base} | An error has occurred and also failed to notify the user`,
            err,
        );
        const failedNotify = new BetterEmbed({
            name: incidentID,
        })
            .setColor(Constants.colors.error)
            .setTitle('Failed to Resolve')
            .setDescription(
                'The error handling system failed to notify the user.',
            );

        const stackEmbed = new ErrorStackEmbed(err, incidentID);

        await sendWebHook({
            content: `<@${ownerID.join('><@')}>`,
            embeds: [failedNotify, stackEmbed],
            webhook: fatalWebhook,
            suppressError: true,
        });
    }
}
