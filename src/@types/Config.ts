export interface Config {
    core: boolean,
    devMode: boolean,
    interval: number,
    restRequestTimeout: number,
    retryLimit: number,
    ownerGuilds: string[],
    owners: string[],
}