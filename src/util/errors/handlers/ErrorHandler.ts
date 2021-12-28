import BaseErrorHandler from './BaseErrorHandler';
import { sendWebHook } from '../../utility';
import {
    fatalWebhook,
    ownerID,
} from '../../../../config.json';

export default class ErrorHandler extends BaseErrorHandler {
    constructor(error: unknown) {
        super(error);
        this.errorLog();
    }

    private errorLog() {
        this.log(this.error);
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
