import { BetterEmbed } from '../../util/utility';
import { FileOptions, SnowflakeUtil } from 'discord.js';
import { Log } from '../../util/Log';
import Constants from '../../util/Constants';

export default class BaseErrorHandler<E> {
    readonly error: E;
    readonly incidentID: string;
    readonly stackAttachment: FileOptions;

    constructor(error: E) {
        this.error = error;
        this.incidentID = SnowflakeUtil.generate();
        this.stackAttachment = {
            attachment: Buffer.from(
                error instanceof Error &&
                error.stack
                    ? error.stack
                    : JSON.stringify(
                        error,
                        Object.getOwnPropertyNames(error),
                        2,
                    ),
            ),
            name: error instanceof Error
                ? `${error.name}.txt`
                : 'error.txt',
        };
    }

    baseErrorEmbed() {
        return new BetterEmbed({ text: this.incidentID })
            .setColor(Constants.colors.error);
    }

    errorEmbed() {
        return this.baseErrorEmbed()
            .setTitle(
                this.error instanceof Error
                    ? this.error.name
                    : 'Error',
            );
    }

    log(...text: unknown[]) {
        const id = `Incident ${
            this.incidentID
        } |`;

        Log.error(id, ...text);
    }
}