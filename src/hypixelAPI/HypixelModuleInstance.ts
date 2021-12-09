export class HypixelModuleInstance {
    abortThreshold: number;
    readonly baseURL: string;
    instanceUses: number;
    keyPercentage: number;
    maxAborts: number;
    resumeAfter: number;

    constructor() {
        this.abortThreshold = 2500;
        this.baseURL = 'https://api.hypixel.net/%{type}%?uuid=%{uuid}%';
        this.instanceUses = 0;
        this.keyPercentage = 0.2;
        this.maxAborts = 1;
        this.resumeAfter = 0;
    }
}
