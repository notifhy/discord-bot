import Constants from '../../Constants';
import { BetterEmbed, formattedUnix } from '../../utility';

export default class BaseErrorHandler {
    error: unknown;
    incidentID: string;

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
            embed.setDescription(
                JSON.stringify(
                    error,
                    Object.getOwnPropertyNames(error),
                    2,
                ).slice(0, Constants.limits.embedDescription),
            );
        }

        return embed;
    }

    log(...text: unknown[]) {
        const time = formattedUnix({ date: true, utc: true });
        const base = `${time} | Incident ${
            this.incidentID
        } |`;

        console.error(base, ...text);
    }

    static staticLog(...text: unknown[]) {
        const time = formattedUnix({ date: true, utc: true });
        const base = `${time} |`;

        console.error(base, ...text);
    }
}
