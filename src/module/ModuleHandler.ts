import { Client, DiscordAPIError, MessageOptions, MessagePayload, Snowflake, TextChannel, User } from 'discord.js';
import { RawUserData, UserAPIData, UserData } from '../@types/database';
import { Field } from '../@types/locales';
import { Differences } from '../@types/modules';
import { SQLiteWrapper } from '../database';
import { HypixelModuleDataManager } from '../hypixelAPI/HypixelModuleDataManager';
import Constants from '../util/Constants';

export class ModuleHandler {
    client: Client;
    differences: Differences;
    userAPIData: UserAPIData;

    constructor(client: Client, hypixelModuleDataManager: HypixelModuleDataManager) {
        this.client = client;
        this.differences = hypixelModuleDataManager.differences;
        this.userAPIData = hypixelModuleDataManager.newUserAPIData;
    }

    async init() {
        const promises = [];

        for (const module of this.userAPIData.modules) {
            promises.push(
                this.client.modules
                    .get(module)!
                    .execute(this),
            );
        }

        await Promise.all(promises);
    }

    async getUser() {
        try {
            const user = await this.client.users.fetch(this.userAPIData.discordID);
            return user;
        } catch (error) {
            if ((error as DiscordAPIError)?.code === 10013) { //Unknown user
                await this.disableAllModules({
                    name: 'Cannot send message',
                    value: 'blah blah blah',
                });
            }

            throw error;
        }
    }

    async getChannel(id: Snowflake) {
        try {
            const channel = await this.client.channels.fetch(id);
            return channel;
        } catch (error) {
            if ((error as DiscordAPIError)?.code === 10003) { //Unknown channel
                await this.disableAllModules({
                    name: 'Cannot send message',
                    value: 'blah blah blah',
                });
            }

            throw error;
        }
    }

    async send(subject: User | TextChannel, data: MessagePayload | MessageOptions) {
        try {
            await subject.send(data);
        } catch (error) {
            let message;
            switch ((error as DiscordAPIError)?.code) {
                case 50007: message = { //Cannot send messages to this user
                    name: 'Cannot send message',
                    value: 'blah blah blah',
                };
                break;
                case 50013: message = { //You lack permissions to perform that action
                    name: 'Cannot send message',
                    value: 'blah blah blah',
                };
                break;
                //No default
            }

            if (message) {
                await this.disableAllModules(message);
            }

            throw error;
        }
    }

    async disableAllModules(message: Field) {
        await SQLiteWrapper.updateUser<
            Partial<UserAPIData>,
            Partial<UserAPIData>
        >({
            discordID: this.userAPIData.discordID,
            table: Constants.tables.api,
            data: { modules: [] },
        });

        const userData = (await SQLiteWrapper.getUser<RawUserData, UserData>({
            discordID: this.userAPIData.discordID,
            table: Constants.tables.users,
            columns: ['systemMessage'],
            allowUndefined: false,
        })) as UserData;

        await SQLiteWrapper.updateUser<
            Partial<UserData>,
            Partial<UserData>
        >({
            discordID: this.userAPIData.discordID,
            table: Constants.tables.api,
            data: { systemMessage: [...userData.systemMessage, message] },
        });
    }
}
/**
 * fetch handler, automatically disables modules as needed
 * disable all at once on cannot send message to user
 */