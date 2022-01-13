import { Log } from '../../Log';
import { MessageEmbed, SnowflakeUtil } from 'discord.js';
import Constants from '../../Constants';

export default class BaseErrorHandler {
    readonly error: unknown;
    readonly incidentID: string;

    constructor(error: unknown) {
        this.error = error;
        this.incidentID = SnowflakeUtil.generate();
    }

    errorEmbed() {
        return new MessageEmbed()
            .setColor(Constants.colors.error)
            .setFooter({ text: `ID ${this.incidentID}` });
    }

    errorStackEmbed(error?: unknown) {
        const embed = this.errorEmbed();

        if (
            error instanceof Error &&
            error.stack
        ) {
            const nonStackLenth = `${error.name}: ${error.message}`.length;
            const stack = error.stack.slice(
                nonStackLenth,
                Constants.limits.embedField + nonStackLenth,
            );

            embed
                .addField(
                    error.name,
                    error.message.slice(0, Constants.limits.embedField),
                )
                .addField('Trace', stack);

            if (nonStackLenth >= Constants.limits.embedDescription) {
                embed.addField(
                    'Over Max Length',
                    'The stack is over 4096 characters long and was cut short',
                );
            }
        } else {
            const data = JSON.stringify(
                 error,
                Object.getOwnPropertyNames(error),
                2,
            );

            embed.setDescription(
                data.slice(0, Constants.limits.embedDescription),
            );

            if (data.length >= Constants.limits.embedDescription) {
                embed.addField(
                    'Over Max Length',
                    'The stack is over 4096 characters long and was cut short',
                );
            }
        }

        return embed;
    }

    log(...text: unknown[]) {
        const id = `Incident ${
            this.incidentID
        } |`;

        Log.error(id, ...text);
    }
}
