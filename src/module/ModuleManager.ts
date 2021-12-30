import type { CleanHypixelPlayer, CleanHypixelStatus } from '../@types/hypixel';
import type { RawUserAPIData, UserAPIData } from '../@types/database';
import { Client, Snowflake } from 'discord.js';
import { ModuleData } from './ModuleData';
import { ModuleHandler } from './ModuleHandler';
import { SQLiteWrapper } from '../database';
import Constants from '../util/Constants';
import ErrorHandler from '../util/errors/handlers/ErrorHandler';

export class ModuleManager {
    readonly client: Client;
    readonly discordID: Snowflake;
    readonly hypixelData: {
        cleanHypixelPlayer: CleanHypixelPlayer,
        cleanHypixelStatus: CleanHypixelStatus | undefined,
    };

    constructor(
        client: Client,
        discordID: Snowflake,
        hypixelData: {
            cleanHypixelPlayer: CleanHypixelPlayer,
            cleanHypixelStatus: CleanHypixelStatus | undefined,
        },
    ) {
        this.client = client;
        this.discordID = discordID;
        this.hypixelData = hypixelData;
    }

    async process() {
        try {
            const currentUserAPIData = (
                await SQLiteWrapper.getUser<
                    RawUserAPIData,
                    UserAPIData
                >({
                    discordID: this.discordID,
                    table: Constants.tables.api,
                    columns: ['*'],
                    allowUndefined: false,
                })
            ) as UserAPIData;

            const moduleData = new ModuleData(
                currentUserAPIData,
                this.hypixelData,
            );

            await moduleData.updateUserAPIData();

            await new ModuleHandler(this.client, moduleData).init();
        } catch (error) {
            this.client.hypixelAPI.errors.addError();
            await new ErrorHandler(error, `ID: ${this.discordID}`)
                .systemNotify();
        }
    }
}