import {
    FileOptions,
    SnowflakeUtil,
} from 'discord.js';
import { Constants } from '../utility/Constants';
import { Log } from '../utility/Log';
import { generateStackTrace, BetterEmbed } from '../utility/utility';

export class BaseErrorHandler<E> {
    readonly error: E;

    readonly incidentID: string;

    readonly stackAttachment: FileOptions;

    constructor(error: E) {
        this.error = error;
        this.incidentID = SnowflakeUtil.generate();

        Object.defineProperty(error, 'fullStack', {
            value: generateStackTrace(),
        });

        this.stackAttachment = {
            attachment: Buffer.from(
                JSON.stringify(
                    error,
                    Object.getOwnPropertyNames(error),
                    4,
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
        const id = `Incident ${this.incidentID} |`;

        Log.error(id, ...text);
    }
}