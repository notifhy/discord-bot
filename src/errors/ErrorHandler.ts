import { BaseErrorHandler } from './BaseErrorHandler';
import {
    fatalWebhook,
    ownerID,
} from '../../config.json';
import { sendWebHook } from '../utility/utility';

export class ErrorHandler<E> extends BaseErrorHandler<E> {
    data: string[];

    constructor(error: E, ...data: string[]) {
        super(error);
        this.data = data;
    }

    static async init<T>(error: T, ...data: string[]) {
        const handler = new ErrorHandler(error, ...data);
        handler.errorLog();
        await handler.systemNotify();
    }

    private errorLog() {
        this.log(this.error);

        if (this.data.length > 0) {
            this.log('Extra data:', ...this.data);
        }
    }

    async systemNotify() {
        await sendWebHook({
            content: `<@${ownerID.join('><@')}>`,
            embeds: [this.errorEmbed()],
            files: [this.stackAttachment],
            webhook: fatalWebhook,
            suppressError: true,
        });
    }
}