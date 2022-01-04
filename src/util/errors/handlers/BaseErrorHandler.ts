import Constants from '../../Constants';
import { Log } from '../../Log';
import {
    BetterEmbed,
} from '../../utility';

export default class BaseErrorHandler {
    readonly error: unknown;
    readonly incidentID: string;

    constructor(error: unknown) {
        this.error = error;
        this.incidentID = Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase();
    }

    errorEmbed() {
        return new BetterEmbed({
            name: this.incidentID,
        }).setColor(Constants.colors.error);
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
