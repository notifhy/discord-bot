import BaseErrorHandler from './BaseErrorHandler';
import { sendWebHook } from '../../util/utility';
import {
    fatalWebhook,
    ownerID,
} from '../../../config.json';

export default class ErrorHandler extends BaseErrorHandler {
    data: string[];

    constructor(error: unknown, ...data: string[]) {
        super(error);
        this.data = data;
        this.errorLog();
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
            embeds: [
                this.errorStackEmbed(this.error),
            ],
            webhook: fatalWebhook,
            suppressError: true,
        });
    }
}