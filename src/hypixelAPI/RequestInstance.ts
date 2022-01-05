import { Performance } from '../hypixelAPI/RequestManager';
import Constants from '../util/errors/Constants';

export class RequestInstance {
    abortThreshold: number;
    readonly baseURL: string;
    instanceUses: number;
    keyPercentage: number;
    maxAborts: number;
    performance: {
        latest: Performance | null;
        history: Performance[];
    };
    resumeAfter: number;

    constructor() {
        this.abortThreshold = 2500;
        this.baseURL = `${Constants.urls.hypixel}%{type}%?uuid=%{uuid}%`;
        this.instanceUses = 0;
        this.keyPercentage = 0.6;
        this.maxAborts = 1;
        this.performance = {
            latest: null,
            history: [],
        };
        this.resumeAfter = 0;
    }
}
